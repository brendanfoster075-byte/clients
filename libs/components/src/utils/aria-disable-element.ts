import { effect } from "@angular/core";

/**
 * a11y helper util used to `aria-disable` elements as opposed to using the HTML `disabled` attr.
 * - Removes HTML `disabled` attr and replaces it with `aria-disabled="true"`
 */
export function ariaDisableElement(element: HTMLElement, isDisabled: boolean) {
  effect(() => {
    if (element.hasAttribute("disabled") || isDisabled) {
      element.removeAttribute("disabled");
      element.setAttribute("aria-disabled", "true");
    }
  });
}
