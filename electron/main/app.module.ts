import { Module } from '@nestjs/common'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { GlobalModule } from './global/global.module'
import { VideoController } from './video.controller'

@Module({
  imports: [GlobalModule],
  controllers: [AppController, VideoController],
  providers: [AppService]
})
export class AppModule {}
