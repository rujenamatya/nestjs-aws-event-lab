import { IsString, MaxLength, MinLength } from 'class-validator';

export class CreateHelloEventDto {
  @IsString()
  @MinLength(1)
  @MaxLength(256)
  message!: string;
}
