import { Injectable, Logger } from '@nestjs/common';
import * as dgram from 'dgram';

@Injectable()
export class WolService {
  private readonly logger = new Logger(WolService.name);

  /**
   * Send a Wake-on-LAN magic packet over the local Wi-Fi network to wake a sleeping TV
   */
  async wake(macAddress: string, broadcastIp = '255.255.255.255', port = 9): Promise<boolean> {
    return new Promise((resolve) => {
      try {
        const cleanMac = macAddress.replace(/[^0-9a-fA-F]/g, '');
        if (cleanMac.length !== 12) {
          this.logger.warn(`Invalid MAC address for WoL: "${macAddress}"`);
          return resolve(false);
        }

        const macBuffer = Buffer.from(cleanMac, 'hex');
        const magicPacket = Buffer.alloc(102);

        // 6 bytes of 0xFF followed by 16 repetitions of MAC
        magicPacket.fill(0xff, 0, 6);
        for (let i = 0; i < 16; i++) {
          macBuffer.copy(magicPacket, 6 + i * 6);
        }

        const client = dgram.createSocket('udp4');

        client.once('error', (err) => {
          this.logger.error(`WoL socket error: ${err.message}`);
          try {
            client.close();
          } catch {}
          resolve(false);
        });

        client.once('listening', () => {
          client.setBroadcast(true);
          client.send(magicPacket, 0, magicPacket.length, port, broadcastIp, (err) => {
            if (err) {
              this.logger.error(`Failed to send WoL packet to ${macAddress}: ${err.message}`);
            } else {
              this.logger.log(`Sent Wake-on-LAN magic packet to ${macAddress} via ${broadcastIp}:${port}`);
            }
            try {
              client.close();
            } catch {}
            resolve(!err);
          });
        });

        client.bind(0);
      } catch (err: any) {
        this.logger.error(`WoL unexpected error: ${err.message}`);
        resolve(false);
      }
    });
  }
}

