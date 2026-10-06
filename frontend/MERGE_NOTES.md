# GoNbite Frontend — Final Merged Version

Merge strategy:
- Visual/UI baseline: `UI_updated_frontend` (first ZIP)
- Protected functionality baseline: `My_frontend` (third ZIP)

Protected functionality retained:
1. Google Login
2. Facebook Login
3. Platform Web/Native Maps
4. Live Delivery Tracking
5. Socket.IO
6. Customer / Restaurant / Delivery roles
7. Active Orders
8. Location selection and checkout address persistence
9. Razorpay
10. Expo Router layouts

Additional merge work:
- Login UI kept from the UI-updated project while Google/Facebook handlers were wired to the working OAuth service.
- Home screen keeps UI-updated design while restoring the saved `gonbite_delivery_address`.
- Checkout uses the working selected-location/address flow.
- API interceptor keeps customer, restaurant, delivery and admin token handling, with environment URL support and local fallback.
- EAS project configuration comes from the current working project.
- TypeScript validation: `npx tsc --noEmit` passes with 0 errors.

Generated folders such as `node_modules`, `.expo`, and `dist` are intentionally excluded from this final source ZIP.
