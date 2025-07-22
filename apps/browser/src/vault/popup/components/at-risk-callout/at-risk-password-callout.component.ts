import { CommonModule } from "@angular/common";
import { Component, inject, effect } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { RouterModule } from "@angular/router";

import { JslibModule } from "@bitwarden/angular/jslib.module";
import { AccountService } from "@bitwarden/common/auth/abstractions/account.service";
import { getUserId } from "@bitwarden/common/auth/services/account.service";
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
    {
      initialValue: {
        hadPendingTasks: false,
        showTasksCompleteBanner: false,
        tasksBannerDismissed: false,
      } as AtRiskPasswordCalloutData,
    },
  );

  currentPendingTasks = toSignal(
    this.atRiskPasswordCalloutService.pendingTasks$(this.userIdSignal()!),
    {
      initialValue: [],
    },
  );

  showTasksResolvedBanner: boolean = false;

  constructor() {
    effect(() => {
      // If the user had the banner showing and left the extension, when they come back the banner should still appear
      if (
        this.atRiskPasswordStateSignal()?.showTasksCompleteBanner &&
        this.currentPendingTasks().length === 0 &&
        !this.atRiskPasswordStateSignal()?.hadPendingTasks
      ) {
        this.showTasksResolvedBanner = true;
      }

      // If the user has resolved all tasks, we will show the banner
      if (
        this.atRiskPasswordStateSignal()?.hadPendingTasks &&
        this.currentPendingTasks().length === 0
      ) {
        const updateObject: AtRiskPasswordCalloutData = {
          hadPendingTasks: false,
          showTasksCompleteBanner: true,
          tasksBannerDismissed: false,
        };
        this.atRiskPasswordCalloutService.updateAtRiskPasswordState(
          this.userIdSignal()!,
          updateObject,
        );
        this.showTasksResolvedBanner = true;
      }

      // Will show callout, will remove any previous dismissed banner state
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

  successBannerDismissed() {
    // If the user dismisses the banner, we will update the state to reflect that
    const updateObject: AtRiskPasswordCalloutData = {
      hadPendingTasks: false,
      showTasksCompleteBanner: false,
      tasksBannerDismissed: true,
    };
    this.atRiskPasswordCalloutService.updateAtRiskPasswordState(this.userIdSignal()!, updateObject);
    this.showTasksResolvedBanner = false;
  }
}
