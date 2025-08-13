import { Component } from "@angular/core";

import { IconModule } from "@bitwarden/components";
import { BitwardenIcon } from "@bitwarden/icons";
import { I18nPipe } from "@bitwarden/ui-common";

@Component({
  selector: "vault-manually-open-extension",
  templateUrl: "./manually-open-extension.component.html",
  imports: [I18nPipe, IconModule],
})
export class ManuallyOpenExtensionComponent {
  protected BitwardenIcon = BitwardenIcon;
}
