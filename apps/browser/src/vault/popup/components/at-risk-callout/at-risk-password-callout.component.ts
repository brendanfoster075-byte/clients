import { CommonModule } from "@angular/common";
import { Component, computed, inject, effect } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { RouterModule } from "@angular/router";

import { JslibModule } from "@bitwarden/angular/jslib.module";
import { AccountService } from "@bitwarden/common/auth/abstractions/account.service";
import { getUserId } from "@bitwarden/common/auth/services/account.service";
import { StateProvider } from "@bitwarden/common/platform/state";
import { AnchorLinkDirective, CalloutModule, BannerModule } from "@bitwarden/components";
import { I18nPipe } from "@bitwarden/ui-common";
import {
  AtRiskPasswordCalloutData,
  AtRiskPasswordCalloutService,
} from "@bitwarden/web-vault/app/vault/services/at-risk-password-callout.service";

@Component({
  selector: "vault-at-risk-password-callout",
  imports: [
    CommonModule,
    AnchorLinkDirective,
    RouterModule,
    CalloutModule,
    I18nPipe,
    BannerModule,
    JslibModule,
  ],
  providers: [AtRiskPasswordCalloutService],
  templateUrl: "./at-risk-password-callout.component.html",
})
export class AtRiskPasswordCalloutComponent {
  private activeAccount$ = inject(AccountService).activeAccount$.pipe(getUserId);
  private atRiskPasswordCalloutService = inject(AtRiskPasswordCalloutService);
  private userIdSignal = toSignal(this.activeAccount$, { initialValue: null });

  private atRiskPasswordStateSignal = toSignal(
    this.atRiskPasswordCalloutService.atRiskPasswordState(this.userIdSignal()!).state$,
  );

  currentPendingTasks = toSignal(
    this.atRiskPasswordCalloutService.pendingTasks$(this.userIdSignal()!),
    {
      initialValue: [],
    },
  );

  showTasksResolved = computed(() => {
    if (this.atRiskPasswordStateSignal() && this.currentPendingTasks().length === 0) {
      return true;
    }
  });

  constructor(private stateProvider: StateProvider) {
    effect(() => {
      if (this.currentPendingTasks().length > 0) {
        const updateObject: AtRiskPasswordCalloutData = {
          hadPendingTasks: true,
          showTasksCompleteBanner: false,
          tasksBannerDismissed: false,
        };
        this.atRiskPasswordCalloutService.updateAtRiskPasswordState(
          this.userIdSignal()!,
          updateObject,
        );
      }
    });
  }
}
