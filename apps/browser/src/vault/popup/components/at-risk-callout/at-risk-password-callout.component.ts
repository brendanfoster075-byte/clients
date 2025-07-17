import { CommonModule } from "@angular/common";
import { Component, computed, inject, effect } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { RouterModule } from "@angular/router";
import { combineLatest, map, switchMap } from "rxjs";

import { JslibModule } from "@bitwarden/angular/jslib.module";
import { AccountService } from "@bitwarden/common/auth/abstractions/account.service";
import { getUserId } from "@bitwarden/common/auth/services/account.service";
import {
  StateProvider,
  UserKeyDefinition,
  VAULT_AT_RISK_PASSWORDS_DISK,
} from "@bitwarden/common/platform/state";
import { CipherService } from "@bitwarden/common/vault/abstractions/cipher.service";
import { SecurityTaskType, TaskService } from "@bitwarden/common/vault/tasks";
import { AnchorLinkDirective, CalloutModule, BannerModule } from "@bitwarden/components";
import { I18nPipe } from "@bitwarden/ui-common";
import { UserId } from "@bitwarden/user-core";

// Move this state provider code and methods into a new at risk password callout service
// a show/hide boolean for the congrats banner
// a dismissed boolean for the banner dismissal
// a hadPendingTasks boolean to track if the user had pending tasks previously

const AT_RISK_ITEMS = new UserKeyDefinition<boolean>(
  VAULT_AT_RISK_PASSWORDS_DISK,
  "atRiskPasswords",
  {
    deserializer: (atRiskItems) => atRiskItems,
    clearOn: ["logout", "lock"],
  },
);

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
  templateUrl: "./at-risk-password-callout.component.html",
})
export class AtRiskPasswordCalloutComponent {
  private taskService = inject(TaskService);
  private cipherService = inject(CipherService);
  private activeAccount$ = inject(AccountService).activeAccount$.pipe(getUserId);
  private userIdSignal = toSignal(this.activeAccount$, { initialValue: null });

  protected pendingTasks$ = this.activeAccount$.pipe(
    switchMap((userId) =>
      combineLatest([
        this.taskService.pendingTasks$(userId),
        this.cipherService.cipherViews$(userId),
      ]),
    ),
    map(([tasks, ciphers]) =>
      tasks.filter((t) => {
        const associatedCipher = ciphers.find((c) => c.id === t.cipherId);

        return (
          t.type === SecurityTaskType.UpdateAtRiskCredential &&
          associatedCipher &&
          !associatedCipher.isDeleted
        );
      }),
    ),
  );

  private atRiskPasswordStateSignal = toSignal(
    this.atRiskPasswordState(this.userIdSignal()!).state$,
  );

  currentPendingTasks = toSignal(this.pendingTasks$, { initialValue: [] });

  showTasksResolved = computed(() => {
    if (this.atRiskPasswordStateSignal() && this.currentPendingTasks().length === 0) {
      return true;
    }
  });

  constructor(private stateProvider: StateProvider) {
    effect(() => {
      if (this.currentPendingTasks().length > 0) {
        this.updateAtRiskPasswordState(this.userIdSignal()!, true);
      }
    });
  }

  private atRiskPasswordState(userId: UserId) {
    return this.stateProvider.getUser(userId, AT_RISK_ITEMS);
  }

  private updateAtRiskPasswordState(userId: UserId, hasAtRiskPassword: boolean) {
    void this.atRiskPasswordState(userId).update(() => hasAtRiskPassword);
  }
}
