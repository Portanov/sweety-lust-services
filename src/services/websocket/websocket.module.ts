import { Module } from '@nestjs/common';
import { WebsocketGateway } from './web-socket.gateway';

@Module({
  providers: [WebsocketGateway],
  exports: [WebsocketGateway],
})
export class WebsocketModule {}
