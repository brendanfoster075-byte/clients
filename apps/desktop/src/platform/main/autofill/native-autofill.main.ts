import { ipcMain } from "electron";

import { FeatureFlag } from "@bitwarden/common/enums/feature-flag.enum";
import { ConfigService } from "@bitwarden/common/platform/abstractions/config/config.service";
import { LogService } from "@bitwarden/common/platform/abstractions/log.service";
import { autofill } from "@bitwarden/desktop-napi";

import { WindowMain } from "../../../main/window.main";

import { CommandDefinition } from "./command";

type BufferedMessage = {
  channel: string;
  data: any;
};

export type RunCommandParams<C extends CommandDefinition> = {
  namespace: C["namespace"];
  command: C["name"];
  params: C["input"];
};

export type RunCommandResult<C extends CommandDefinition> = C["output"];

export class NativeAutofillMain {
  private ipcServer: autofill.IpcServer | null;
  private messageBuffer: BufferedMessage[] = [];
  private listenerReady = false;

  constructor(
    private logService: LogService,
    private windowMain: WindowMain,
    private configService: ConfigService,
  ) {}

  /**
   * Safely sends a message to the renderer, buffering it if the server isn't ready yet
   * @returns true if successful, false if feature flag is disabled
   */
  private async safeSend(channel: string, data: any): Promise<boolean> {
    const featureFlagEnabled = await this.configService.getFeatureFlag(
      FeatureFlag.MacOsNativeCredentialSync,
    );

    if (!featureFlagEnabled) {
      this.logService.debug(
        `exiting safeSend(${channel}): MacOsNativeCredentialSync feature flag is disabled`,
      );
      return false;
    }

    if (this.listenerReady && this.windowMain.win?.webContents) {
      this.windowMain.win.webContents.send(channel, data);
    } else {
      this.logService.info(
        `Buffering message to ${channel} until server is ready. Call .listenerReady() to flush.`,
      );
      this.messageBuffer.push({ channel, data });
    }

    return true;
  }

  /**
   * Checks if the MacOsNativeCredentialSync feature flag is enabled, and if not, completes the request with an error
   * @param data The IPC data containing clientId and sequenceNumber
   * @returns true if feature flag is enabled, false if disabled (and error was sent)
   */
  private async checkFeatureFlagOrError(data: {
    clientId: number;
    sequenceNumber: number;
  }): Promise<boolean> {
    if (!(await this.configService.getFeatureFlag(FeatureFlag.MacOsNativeCredentialSync))) {
      const { clientId, sequenceNumber } = data;
      this.ipcServer.completeError(
        clientId,
        sequenceNumber,
        "MacOsNativeCredentialSync feature flag is disabled",
      );
      return false;
    }
    return true;
  }

  /**
   * Flushes all buffered messages to the renderer
   */
  private flushMessageBuffer() {
    if (!this.windowMain.win?.webContents) {
      this.logService.error("Cannot flush message buffer - window not available");
      return;
    }

    this.logService.info(`Flushing ${this.messageBuffer.length} buffered messages`);

    for (const { channel, data } of this.messageBuffer) {
      this.windowMain.win.webContents.send(channel, data);
    }

    this.messageBuffer = [];
  }

  async init() {
    ipcMain.handle(
      "autofill.runCommand",
      async <C extends CommandDefinition>(
        _event: any,
        params: RunCommandParams<C>,
      ): Promise<RunCommandResult<C>> => {
        if (!(await this.configService.getFeatureFlag(FeatureFlag.MacOsNativeCredentialSync))) {
          return {
            type: "error",
            error: "MacOsNativeCredentialSync feature flag is disabled",
          } as RunCommandResult<C>;
        }

        return this.runCommand(params);
      },
    );

    this.ipcServer = await autofill.IpcServer.listen(
      "autofill",
      // RegistrationCallback
      async (error, clientId, sequenceNumber, request) => {
        if (error) {
          this.logService.error("autofill.IpcServer.registration", error);
          this.ipcServer.completeError(clientId, sequenceNumber, String(error));
          return;
        }
        const success = await this.safeSend("autofill.passkeyRegistration", {
          clientId,
          sequenceNumber,
          request,
        });
        if (!success) {
          this.ipcServer.completeError(
            clientId,
            sequenceNumber,
            "MacOsNativeCredentialSync feature flag is disabled",
          );
        }
      },
      // AssertionCallback
      async (error, clientId, sequenceNumber, request) => {
        if (error) {
          this.logService.error("autofill.IpcServer.assertion", error);
          this.ipcServer.completeError(clientId, sequenceNumber, String(error));
          return;
        }
        const success = await this.safeSend("autofill.passkeyAssertion", {
          clientId,
          sequenceNumber,
          request,
        });
        if (!success) {
          this.ipcServer.completeError(
            clientId,
            sequenceNumber,
            "MacOsNativeCredentialSync feature flag is disabled",
          );
        }
      },
      // AssertionWithoutUserInterfaceCallback
      async (error, clientId, sequenceNumber, request) => {
        if (error) {
          this.logService.error("autofill.IpcServer.assertion", error);
          this.ipcServer.completeError(clientId, sequenceNumber, String(error));
          return;
        }
        const success = await this.safeSend("autofill.passkeyAssertionWithoutUserInterface", {
          clientId,
          sequenceNumber,
          request,
        });
        if (!success) {
          this.ipcServer.completeError(
            clientId,
            sequenceNumber,
            "MacOsNativeCredentialSync feature flag is disabled",
          );
        }
      },
      // NativeStatusCallback
      async (error, clientId, sequenceNumber, status) => {
        if (error) {
          this.logService.error("autofill.IpcServer.nativeStatus", error);
          this.ipcServer.completeError(clientId, sequenceNumber, String(error));
          return;
        }
        const success = await this.safeSend("autofill.nativeStatus", {
          clientId,
          sequenceNumber,
          status,
        });
        if (!success) {
          this.ipcServer.completeError(
            clientId,
            sequenceNumber,
            "MacOsNativeCredentialSync feature flag is disabled",
          );
        }
      },
    );

    ipcMain.on("autofill.listenerReady", async () => {
      if (!(await this.configService.getFeatureFlag(FeatureFlag.MacOsNativeCredentialSync))) {
        return;
      }

      this.listenerReady = true;
      this.logService.info(
        `Listener is ready, flushing ${this.messageBuffer.length} buffered messages`,
      );
      this.flushMessageBuffer();
    });

    ipcMain.on("autofill.completePasskeyRegistration", async (event, data) => {
      if (!(await this.checkFeatureFlagOrError(data))) {
        return;
      }

      this.logService.warning("autofill.completePasskeyRegistration", data);
      const { clientId, sequenceNumber, response } = data;
      this.ipcServer.completeRegistration(clientId, sequenceNumber, response);
    });

    ipcMain.on("autofill.completePasskeyAssertion", async (event, data) => {
      if (!(await this.checkFeatureFlagOrError(data))) {
        return;
      }

      this.logService.warning("autofill.completePasskeyAssertion", data);
      const { clientId, sequenceNumber, response } = data;
      this.ipcServer.completeAssertion(clientId, sequenceNumber, response);
    });

    ipcMain.on("autofill.completeError", async (event, data) => {
      if (!(await this.checkFeatureFlagOrError(data))) {
        return;
      }

      this.logService.warning("autofill.completeError", data);
      const { clientId, sequenceNumber, error } = data;
      this.ipcServer.completeError(clientId, sequenceNumber, String(error));
    });
  }

  private async runCommand<C extends CommandDefinition>(
    command: RunCommandParams<C>,
  ): Promise<RunCommandResult<C>> {
    try {
      const result = await autofill.runCommand(JSON.stringify(command));
      const parsed = JSON.parse(result) as RunCommandResult<C>;

      if (parsed.type === "error") {
        this.logService.error(`Error running autofill command '${command.command}':`, parsed.error);
      }

      return parsed;
    } catch (e) {
      this.logService.error(`Error running autofill command '${command.command}':`, e);

      if (e instanceof Error) {
        return { type: "error", error: e.stack ?? String(e) } as RunCommandResult<C>;
      }

      return { type: "error", error: String(e) } as RunCommandResult<C>;
    }
  }
}
