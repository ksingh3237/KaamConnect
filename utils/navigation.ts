import { router, Href } from 'expo-router';

// Go to `href` and drop every screen stacked above the root, so Back can't return
// into a flow the user has already finished (onboarding, payment + review, logout).
export function resetTo(href: Href) {
  if (router.canDismiss()) router.dismissAll();
  router.replace(href);
}
