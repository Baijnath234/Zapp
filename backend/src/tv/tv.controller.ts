import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  ValidationPipe,
  UsePipes,
} from '@nestjs/common';
import { TvService } from './tv.service';
import { ConnectTvDto, PairTvDto, SendKeyDto, LaunchAppDto, TvSettingsDto } from './dto/tv.dto';

@Controller('api/tv')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class TvController {
  constructor(private readonly tvService: TvService) {}

  @Get('status')
  getStatus() {
    return {
      success: true,
      data: this.tvService.getState(),
    };
  }

  @Get('discover')
  async discover() {
    const devices = await this.tvService.scanNearby();
    return {
      success: true,
      data: devices,
    };
  }

  @Get('discovered')
  getDiscovered() {
    return {
      success: true,
      data: this.tvService.getDiscoveredTvs(),
    };
  }

  @Get('saved')
  getSaved() {
    return {
      success: true,
      data: this.tvService.getSavedTvs(),
    };
  }

  @Delete('saved/:ip')
  forgetTv(@Param('ip') ip: string) {
    const deleted = this.tvService.forgetTv(ip);
    return {
      success: deleted,
      message: deleted ? 'TV forgotten successfully' : 'TV not found',
    };
  }

  @Post('connect')
  @HttpCode(HttpStatus.OK)
  async connect(@Body() dto: ConnectTvDto) {
    const state = await this.tvService.connectTv(dto);
    return {
      success: true,
      data: state,
    };
  }

  @Post('pair')
  @HttpCode(HttpStatus.OK)
  pair(@Body() dto: PairTvDto) {
    const success = this.tvService.pairTv(dto);
    return {
      success,
      message: success ? 'Pair code submitted' : 'Failed to submit pair code',
    };
  }

  @Post('disconnect')
  @HttpCode(HttpStatus.OK)
  disconnect() {
    this.tvService.disconnectTv();
    return {
      success: true,
      message: 'Disconnected',
    };
  }

  @Post('key')
  @HttpCode(HttpStatus.OK)
  sendKey(@Body() dto: SendKeyDto) {
    const success = this.tvService.sendKey(dto);
    return {
      success,
      key: dto.key,
    };
  }

  @Post('power')
  @HttpCode(HttpStatus.OK)
  sendPower() {
    const success = this.tvService.sendPower();
    return {
      success,
    };
  }

  @Post('app')
  @HttpCode(HttpStatus.OK)
  launchApp(@Body() dto: LaunchAppDto) {
    const success = this.tvService.launchApp(dto.appLink);
    return {
      success,
      appLink: dto.appLink,
    };
  }

  @Get('settings')
  getSettings() {
    return {
      success: true,
      data: this.tvService.getSettings(),
    };
  }

  @Post('settings')
  @HttpCode(HttpStatus.OK)
  updateSettings(@Body() dto: TvSettingsDto) {
    const updated = this.tvService.updateSettings(dto);
    return {
      success: true,
      data: updated,
    };
  }
}

