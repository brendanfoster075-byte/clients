import { Component, EventEmitter, Input, Output } from "@angular/core";

import { gearIcon } from "@bitwarden/icons";
import { SharedOrganizationModule } from "@bitwarden/web-vault/app/admin-console/organizations/shared";

@Component({
  selector: "app-no-clients",
  imports: [SharedOrganizationModule],
  template: `<div class="tw-flex tw-flex-col tw-items-center tw-text-info">
    <bit-icon [icon]="icon"></bit-icon>
    <p class="tw-mt-4">{{ "noClients" | i18n }}</p>
    <a
      *ngIf="showAddOrganizationButton"
      [disabled]="disableAddOrganizationButton"
      type="button"
      bitButton
      buttonType="primary"
      (click)="addNewOrganization()"
    >
      <i class="bwi bwi-plus bwi-fw" aria-hidden="true"></i>
      {{ "addNewOrganization" | i18n }}
    </a>
  </div>`,
})
export class NoClientsComponent {
  icon = gearIcon;
  @Input() showAddOrganizationButton = true;
  @Input() disableAddOrganizationButton = false;
  @Output() addNewOrganizationClicked = new EventEmitter();

  addNewOrganization = () => this.addNewOrganizationClicked.emit();
}
