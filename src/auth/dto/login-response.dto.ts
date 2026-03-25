export class LoginResponseDto {
  access_token: string;
  user: {
    id: number;
    username: string;
    email: string;
    role: string;
  };
}
