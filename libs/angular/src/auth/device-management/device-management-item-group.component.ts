import { CommonModule } from "@angular/common";
import { Component, Input } from "@angular/core";
import { firstValueFrom } from "rxjs";

import { DevicePendingAuthRequest } from "@bitwarden/common/auth/abstractions/devices/responses/device.response";
import { BadgeModule, DialogService, ItemModule } from "@bitwarden/components";
import { I18nPipe } from "@bitwarden/ui-common";

import { LoginApprovalDialogComponent } from "../login-approval/login-approval-dialog.component";

import { DeviceDisplayData } from "./device-management.component";
import { clearAuthRequestAndResortDevices } from "./resort-devices.helper";

/** Displays user devices in an item list view */
@Component({
  standalone: true,
  selector: "auth-device-management-item-group",
  templateUrl: "./device-management-item-group.component.html",
  imports: [BadgeModule, CommonModule, ItemModule, I18nPipe],
})
export class DeviceManagementItemGroupComponent {
  @Input() devices: DeviceDisplayData[] = [];

  constructor(private dialogService: DialogService) {}

  protected async approveOrDenyAuthRequest(pendingAuthRequest: DevicePendingAuthRequest | null) {
    if (pendingAuthRequest == null) {
      return;
    }

    const loginApprovalDialog = LoginApprovalDialogComponent.open(this.dialogService, {
      notificationId: pendingAuthRequest.id,
    });

    const result = await firstValueFrom(loginApprovalDialog.closed);

    if (result !== undefined && typeof result === "boolean") {
      // Auth request was approved or denied, so clear the
      // pending auth request and re-sort the device array
      this.devices = clearAuthRequestAndResortDevices(this.devices, pendingAuthRequest);
    }
  }
}
