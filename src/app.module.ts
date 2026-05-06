import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import configuration from './config/configuration';
import { validateEnv } from './config/env.validation';
import { HealthController } from './health/health.controller';
import { HelloEventsModule } from './hello-events/hello-events.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validate: validateEnv,
    }),
    HelloEventsModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
