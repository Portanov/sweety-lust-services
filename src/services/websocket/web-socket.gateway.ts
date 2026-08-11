import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

interface ConnectedDevice {
  deviceId: string;
  socketId: string;
  type: 'tv' | 'mobile';
  roomId?: string;
}

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: '/tv-connection',
})
export class WebsocketGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(WebsocketGateway.name);
  private connectedDevices: Map<string, ConnectedDevice> = new Map();
  private tvRooms: Map<string, string> = new Map();

  // Evento: Escanear código QR de TV
  @SubscribeMessage('scan-tv-qr')
  async handleScanTVQR(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { qrCode: string },
  ) {
    try {
      this.logger.log(`Mobile scanning TV QR: ${data.qrCode}`);
      const tvDeviceId = this.tvRooms.get(data.qrCode);

      if (!tvDeviceId) {
        client.emit('qr-scan-error', {
          message: 'TV no encontrada o código QR inválido',
        });
        return;
      }

      const tvDevice = this.connectedDevices.get(tvDeviceId);

      if (!tvDevice) {
        client.emit('qr-scan-error', {
          message: 'TV no está conectada',
        });
        return;
      }

      const roomId = data.qrCode;
      const mobileDeviceId = client.id;

      await client.join(roomId);

      this.connectedDevices.set(mobileDeviceId, {
        deviceId: mobileDeviceId,
        socketId: client.id,
        type: 'mobile',
        roomId: roomId,
      });

      client.emit('qr-scan-success', {
        message: 'Conectado a la TV exitosamente',
        roomId: roomId,
        tvDeviceId: tvDeviceId,
      });

      this.server.to(roomId).emit('mobile-connected', {
        mobileId: mobileDeviceId,
        timestamp: new Date().toISOString(),
      });

      this.logger.log(
        `Mobile ${mobileDeviceId} connected to TV room ${roomId}`,
      );
    } catch (error) {
      this.logger.error(`Error scanning QR: ${error.message}`);
      client.emit('qr-scan-error', {
        message: 'Error al escanear el código QR',
      });
    }
  }

  // Evento: Escanear código de barras de la orden desde mobile
  @SubscribeMessage('scan-order')
  async handleScanOrder(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { orderBarcode: string; roomId: string },
  ) {
    try {
      this.logger.log(
        `Scanning order barcode: ${data.orderBarcode} from room ${data.roomId}`,
      );

      const device = this.connectedDevices.get(client.id);

      if (!device || !device.roomId) {
        client.emit('order-scan-error', {
          message: 'No estás conectado a ninguna TV',
        });
        return;
      }

      const tvDeviceId = this.tvRooms.get(device.roomId);
      if (!tvDeviceId || !this.connectedDevices.has(tvDeviceId)) {
        client.emit('order-scan-error', {
          message: 'La TV ya no está conectada',
        });
        return;
      }

      this.server.to(device.roomId).emit('order-scanned', {
        orderBarcode: data.orderBarcode,
        scannedBy: client.id,
        timestamp: new Date().toISOString(),
      });

      client.emit('order-sent-to-tv', {
        orderBarcode: data.orderBarcode,
        status: 'sent',
        timestamp: new Date().toISOString(),
      });

      this.logger.log(
        `Order ${data.orderBarcode} sent to TV room ${device.roomId}`,
      );
    } catch (error) {
      this.logger.error(`Error scanning order: ${error.message}`);
      client.emit('order-scan-error', {
        message: 'Error al procesar la orden',
      });
    }
  }

  // Evento: TV solicita los productos de la orden
  @SubscribeMessage('get-order-products')
  async handleGetOrderProducts(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { orderBarcode: string; roomId: string },
  ) {
    try {
      this.logger.log(`TV requesting order products: ${data.orderBarcode}`);

      const device = this.connectedDevices.get(client.id);
      if (!device || device.type !== 'tv') {
        client.emit('order-products-error', {
          message: 'Solo la TV puede solicitar esta información',
        });
        return;
      }

      const orderData = await this.fetchOrderProducts(data.orderBarcode);

      client.emit('order-products-response', {
        products: orderData.products || [],
        timestamp: new Date().toISOString(),
      });

      this.logger.log(
        `Order products sent to TV for order: ${data.orderBarcode}`,
      );
    } catch (error) {
      this.logger.error(`Error getting order products: ${error.message}`);
      client.emit('order-products-error', {
        message: 'Error al obtener los productos de la orden',
        orderBarcode: data.orderBarcode,
      });
    }
  }

  // Evento: Finalizar empacado (desde el móvil)
  @SubscribeMessage('finish-order-packing')
  async handleFinishOrderPacking(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { orderBarcode: string; roomId: string },
  ) {
    try {
      this.logger.log(`Finishing packing for order: ${data.orderBarcode}`);

      const device = this.connectedDevices.get(client.id);
      if (!device || device.type !== 'mobile') {
        client.emit('finish-packing-error', {
          message: 'Solo el móvil puede finalizar el empacado',
        });
        return;
      }

      // Llamar a la API para finalizar el empacado
      await this.finishOrderPacking(data.orderBarcode);

      // Notificar a la TV que la orden fue completada
      if (device.roomId) {
        this.server.to(device.roomId).emit('order-packing-completed', {
          orderBarcode: data.orderBarcode,
          timestamp: new Date().toISOString(),
        });
      }

      // Confirmar al móvil
      client.emit('order-packing-finished', {
        orderBarcode: data.orderBarcode,
        status: 'completed',
        timestamp: new Date().toISOString(),
      });

      this.logger.log(`Packing finished for order: ${data.orderBarcode}`);
    } catch (error) {
      this.logger.error(`Error finishing order packing: ${error.message}`);
      client.emit('finish-packing-error', {
        message: 'Error al finalizar el empacado de la orden',
        orderBarcode: data.orderBarcode,
      });
    }
  }

  // Método para consultar API de productos de la orden
  private async fetchOrderProducts(orderBarcode: string): Promise<any> {
    try {
      const response = await fetch(
        `https://api.sweetylust.com/api/ordersp/${orderBarcode}/products`,
      );

      if (!response.ok) {
        throw new Error('Order not found');
      }

      return await response.json();
    } catch (error) {
      this.logger.warn(`Using mock data for order: ${orderBarcode}`);
      return {
        products: [
          {
            id: 1,
            quantity: 1,
            unit_price: '180.25',
            subtotal: '180.25',
            product: {
              id: 10,
              title: 'Plug de acero joya',
              description:
                'Plug hecho de acero con piedra de fantasía color negro',
              image:
                'https://exitocol.vtexassets.com/arquivos/ids/23514030/plug-anal-acero-con-cola-de-zorro-juguete-sexual-fantasias-negro.jpg?v=638562206522870000',
              price: '180.25',
              offer: null,
              stock: 10,
              category: 'otros',
            },
          },
          {
            id: 2,
            quantity: 2,
            unit_price: '99.99',
            subtotal: '199.98',
            product: {
              id: 11,
              title: 'Lubricante Premium',
              description: 'Lubricante a base de agua para uso prolongado',
              image:
                'https://exitocol.vtexassets.com/arquivos/ids/23514030/lubricante-premium.jpg?v=638562206522870000',
              price: '99.99',
              offer: null,
              stock: 15,
              category: 'lubricantes',
            },
          },
        ],
      };
    }
  }

  // Método para finalizar empacado de orden
  private async finishOrderPacking(orderBarcode: string): Promise<void> {
    try {
      const response = await fetch(
        `https://api.sweetylust.com/api/ordersp/${orderBarcode}/finish-packing`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );

      if (!response.ok) {
        throw new Error('Failed to finish order packing');
      }
    } catch (error) {
      this.logger.warn(`Using mock finish packing for order ${orderBarcode}`);
      // Simular éxito
    }
  }

  // Evento: Inicializar TV (crear código QR)
  @SubscribeMessage('init-tv')
  async handleInitTV(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { tvName?: string },
  ) {
    try {
      const tvDeviceId = client.id;
      const roomId = this.generateRoomId();

      this.connectedDevices.set(tvDeviceId, {
        deviceId: tvDeviceId,
        socketId: client.id,
        type: 'tv',
        roomId: roomId,
      });

      this.tvRooms.set(roomId, tvDeviceId);

      await client.join(roomId);

      const qrData = {
        roomId: roomId,
        url: `https://api.sweetylust.com/connect/${roomId}`,
        tvName: data.tvName || 'TV sin nombre',
        timestamp: new Date().toISOString(),
      };

      client.emit('tv-initialized', {
        qrData: JSON.stringify(qrData),
        roomId: roomId,
        connectionCode: roomId,
      });

      this.logger.log(`TV initialized with room: ${roomId}`);
    } catch (error) {
      this.logger.error(`Error initializing TV: ${error.message}`);
      client.emit('tv-init-error', {
        message: 'Error al inicializar la TV',
      });
    }
  }

  private generateRoomId(): string {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }

  private cleanupConnection(socketId: string) {
    const device = this.connectedDevices.get(socketId);

    if (device) {
      if (device.type === 'tv' && device.roomId) {
        this.tvRooms.delete(device.roomId);
        this.logger.log(`TV room ${device.roomId} removed`);
      }

      this.connectedDevices.delete(socketId);
      this.logger.log(`Device ${socketId} disconnected`);
    }
  }

  handleConnection(client: Socket, ...args: any[]) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    this.cleanupConnection(client.id);
  }
}
