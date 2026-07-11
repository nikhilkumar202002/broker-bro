# Broker Bro Seller Panel — Project Documentation

## 1. Project overview

The Broker Bro Seller Panel is a client-side React application for operating a property marketplace. It provides screens for authentication, dashboard reporting, property creation and moderation, property classification, user administration, amenities, facilities, and geographic reference data.

The application is a Vite single-page application. It communicates with a separate REST backend and uses browser-side Leaflet maps for selecting property coordinates.

### Main capabilities

- Authenticate an administrator or seller and store a bearer token.
- View dashboard property totals and recent listing information.
- Create property listings with media, pricing, classifications, features, and exact coordinates.
- Search locations and reverse-geocode coordinates.
- Display satellite imagery with place labels.
- Approve, feature, activate, inspect, and delete properties.
- Manage property categories and property types.
- Browse admins, sellers, customers, amenities, facilities, countries, states, and districts.

## 2. Technology stack

| Area | Technology |
|---|---|
| UI | React 19 |
| Build tool | Vite 8 |
| Routing | React Router 7 |
| Styling | Tailwind CSS 4 and global CSS |
| HTTP client | Axios |
| Notifications | React Hot Toast |
| Icons | React Icons |
| Maps | Leaflet and React Leaflet |
| Geocoding | OpenStreetMap Nominatim |
| Map imagery | Esri World Imagery and Esri reference labels |
| Language | JavaScript with JSX and ES modules |

There is no TypeScript, server-side rendering, global state library, form library, or automated test framework configured.

## 3. Requirements and installation

### Prerequisites

- A current Node.js release compatible with Vite 8.
- npm, using the committed `package-lock.json`.
- Access to the configured Broker Bro backend.
- Network access to map tiles and the configured geocoding service.

### Install and run

```bash
npm install
cp .env.example .env
npm run dev
```

Production workflow:

```bash
npm run build
npm run preview
```

The production output is written to `dist/` and is excluded from Git.

## 4. Environment configuration

All client-exposed Vite variables must start with `VITE_`. These values are bundled into the browser application and must never contain secrets.

| Variable | Required | Default | Purpose |
|---|---:|---|---|
| `VITE_API_BASE_URL` | No | `https://brokerbroapi.realtybrokerbro.com/api` | REST backend base URL. |
| `VITE_NOMINATIM_BASE_URL` | No | `https://nominatim.openstreetmap.org` | Nominatim server or a backend geocoding proxy. |
| `VITE_NOMINATIM_COUNTRYCODES` | No | unrestricted | Optional country-code restriction for search, such as `in`. |
| `VITE_DEFAULT_MAP_LATITUDE` | No | central India fallback | Default map latitude before a property point is selected. |
| `VITE_DEFAULT_MAP_LONGITUDE` | No | central India fallback | Default map longitude before a property point is selected. |

For sustained production geocoding traffic, route requests through a policy-compliant backend proxy or managed Nominatim instance. Do not place private credentials in frontend environment variables.

## 5. Source structure

```text
src/
├── components/
│   ├── PropertyLocationMap.jsx       Reusable map and geocoding UI
│   ├── layout/                       Dashboard shell, header, and sidebar
│   └── ui/PropertyModal.jsx          Reusable property editor modal
├── constants/                        Static constants
├── features/
│   ├── auth/Login.jsx                Login workflow
│   └── properties/components/        Property/category/type forms
├── pages/                             Route-level screens
├── routes/AppRouter.jsx              Route declaration
├── services/
│   ├── api.js                        Axios client and backend operations
│   └── geocoding.js                  Nominatim operations
├── App.jsx                            Router and global toast host
├── index.css                         Tailwind import and global font styles
└── main.jsx                          React entry point and Leaflet CSS import
```

### Application bootstrap

`src/main.jsx` mounts the app under React `StrictMode`, loads global CSS, and imports Leaflet CSS once. `src/App.jsx` renders the router and the global top-right toast container.

### Layout

`DashboardLayout` creates a full-height shell containing:

- A responsive, collapsible sidebar.
- A sticky header.
- A vertically scrolling route outlet.

The sidebar contains Dashboard, Properties, Property Setting, Categories, Users, World, and Logout navigation.

## 6. Routes

| Route | Screen | Purpose |
|---|---|---|
| `/` | Redirect | Redirects to `/login`. |
| `/login` | `Login` | Email/password authentication. |
| `/dashboard` | `Dashboard` | Property summary and recent activity. |
| `/properties` | `PropertiesList` | Property creation, filtering, inspection, and moderation. |
| `/world` | `World` | Browse countries, states, and districts. |
| `/categories/property-type` | `PropertyList` | Create, edit, activate, deactivate, and delete types. |
| `/categories/property-category` | `CategoryList` | Create, edit, toggle, and delete categories. |
| `/property-setting/amenities` | `Amenties` | Paginated amenity list. |
| `/property-setting/facilities` | `Facilities` | Paginated facility list. |
| `/users/admin` | `AdminUsers` | List and create admins. |
| `/users/sellers` | `Sellers` | List and activate/deactivate sellers. |
| `/users/customers` | `Customers` | List customers. |

Current routing does not include an authentication guard. A user can navigate to dashboard URLs without a frontend redirect, although protected backend calls may still fail without a valid token. Production deployments should add a route guard and handle expired sessions.

## 7. Authentication

Login calls `POST /users/login` with:

```json
{
  "email": "user@example.com",
  "password": "password"
}
```

The login screen accepts tokens from these response paths:

- `data.token`
- `data.access_token`
- `data.data.token`
- `data.data.access_token`

The token is stored under `localStorage.token`. The Axios request interceptor adds it to subsequent requests:

```http
Authorization: Bearer <token>
```

Logout clears `token` and `user` from local storage and navigates to `/login`.

### Security considerations

- Local storage is accessible to JavaScript; strong XSS prevention is required.
- There is no refresh-token workflow in this frontend.
- There is no centralized handling that redirects on `401` responses.
- Debug logging around login and form submission should be removed or disabled for production.

## 8. API client

`src/services/api.js` owns the Axios instance, authorization header, response normalization, error toasts, and upload conversion.

### Response normalization

The interceptor recursively normalizes backend entities:

- Copies `_id` to `id` when `id` is missing.
- Converts string roles to `{ name: role }`.
- Supplies an empty `mobile` field when absent.

Page components additionally tolerate several list shapes, including arrays and nested `data`, `items`, `properties`, or domain-specific keys.

### File uploads

`withUploadSupport` detects `File` or `Blob` values. When present, the payload becomes `FormData`. Array values are appended as repeated keys. Without uploads, the original JavaScript object is sent as JSON.

### Backend endpoint reference

#### Authentication

| Method | Endpoint | Client function |
|---|---|---|
| POST | `/users/login` | `login` |

#### Property categories

| Method | Endpoint | Client function |
|---|---|---|
| POST | `/property-categories` | `createCategory` |
| PUT | `/property-categories/:id` | `updateCategory` |
| GET | `/property-categories` | `getCategories` |
| DELETE | `/property-categories/:id` | `deleteCategory` |

Activation and deactivation use the update endpoint with `{ status: 'active' }` or `{ status: 'inactive' }`.

#### Property types

| Method | Endpoint | Client function |
|---|---|---|
| POST | `/property-types` | `createPropertyType` |
| PUT | `/property-types/:id` | `updatePropertyType` |
| GET | `/property-types` | `getPropertyTypes` |
| DELETE | `/property-types/:id` | `deletePropertyType` |
| PUT | `/property-types/:id/activate` | `activatePropertyType` |
| PUT | `/property-types/:id/deactivate` | `deactivatePropertyType` |

#### Properties

| Method | Endpoint | Client function |
|---|---|---|
| POST | `/properties` | `createProperty` |
| PUT | `/properties/:id` | `updateProperty` |
| GET | `/properties` | `getProperties` |
| GET | `/properties/:id` | `getProperty` |
| DELETE | `/properties/:id` | `deleteProperty` |
| PATCH | `/properties/:id/approve` | `approveProperty` |
| PATCH | `/properties/:id/status` | `updatePropertyStatus` |
| PATCH | `/properties/:id/feature` | `featureProperty` |
| PATCH | `/properties/:id/unfeature` | `unfeatureProperty` |
| GET | `/property-statuses` | `getPropertyStatuses` |

#### Amenities, facilities, and world data

| Method | Endpoint | Client function |
|---|---|---|
| GET | `/amenities` | `getAmenities` |
| POST | `/amenities` | `createAmenity` |
| GET | `/facilities` | `getFacilities` |
| POST | `/facilities` | `createFacility` |
| GET | `/countries` | `getCountries` |
| GET | `/countries/:id/states-districts` | `getCountryStatesDistricts` |
| GET | `/states` | `getStates` |
| GET | `/districts` | `getDistricts` |

#### Users

| Method | Endpoint | Client function |
|---|---|---|
| GET | `/users` | `getUsers` and role-filtered helpers |
| POST | `/users/register/admin` | `createAdminUser` |
| PATCH | `/users/:id/activate-seller` | `activateUser` |
| PATCH | `/users/:id/deactivate-seller` | `deactivateUser` |

## 9. Property management

### Property list

The Properties screen loads listings, categories, types, and property statuses. It supports client-side search and filters, pagination, image galleries, property detail viewing, approval, featured state, active state, and deletion.

The Add Property action renders `CreateProperty` rather than `PropertyModal`. `PropertyModal` remains a reusable editor but is not the primary creation UI on the current Properties page.

### Property creation flow

`CreateProperty` is a sectioned form with the following flow:

1. Mark the exact property location.
2. Add basic details and choose selling or rental.
3. Choose property category and, for selling, property type.
4. Select country/state/district when that section applies.
5. Enter size and pricing details.
6. Enter optional room specifications.
7. Select amenities and facilities.
8. Upload images and optional videos.
9. Accept the publishing disclaimer.
10. Submit the listing.

India and Kerala are selected by matching API-provided names and using their returned IDs. District is intentionally left for manual selection.

### Form fields

Common fields include:

- `name`, `description`, `location`, `address`
- `latitude`, `longitude`
- `property_category_ids`, `property_type_ids`, `property_type_value`
- `country_id`, `state_id`, `district_id`
- `property_images_files`, `property_videos_files`
- `amount`, `per_cent`, `total_cent`, `sq_feet`
- `bhk`, bedroom, bathroom, kitchen, and hall counts
- `facilities_ids`, `amenities_ids`
- `is_rented`

Images are required on creation. Videos are optional and limited to two. Selected media receives local object-URL previews, and those URLs are revoked during cleanup.

### Selling payload

Representative shape:

```js
{
  name,
  description,
  location,
  address,
  latitude: Number(latitude),
  longitude: Number(longitude),
  is_rented: false,
  amount,
  property_category_ids: [categoryId],
  property_type_ids: [propertyTypeId],
  property_type_value,
  per_cent,
  total_cent,
  bhk,
  sq_feet,
  facilities_ids: [],
  amenities_ids: [],
  property_images_files: [File],
  property_videos_files: [File]
}
```

### Rental payload

Representative shape:

```js
{
  name,
  description,
  location,
  address,
  latitude: Number(latitude),
  longitude: Number(longitude),
  is_rented: true,
  amount_per_month: amount,
  property_category_ids: [categoryId],
  facilities_ids: [],
  amenities_ids: [],
  property_images_files: [File],
  property_videos_files: [File]
}
```

Rental submission excludes selling-specific type, land-price, BHK, and square-foot transformations where implemented by the form.

### Validation

- Native HTML validation handles required fields and numeric constraints.
- Latitude must be between `-90` and `90`.
- Longitude must be between `-180` and `180`.
- Coordinates must exist before submission.
- The disclaimer must be accepted.
- Duplicate submission is prevented while saving.
- Submission is disabled while reverse geocoding is resolving.

## 10. Map and geocoding

`PropertyLocationMap` is a controlled component. The parent owns latitude, longitude, address, and locality values.

### Supported interactions

- Search for a city, locality, landmark, or address.
- Select a Nominatim result.
- Click the map to place a marker.
- Drag the marker to refine the point.
- Use browser geolocation after an explicit button click.
- Reverse-geocode clicks, drags, and current-location results.
- Preserve coordinates when reverse geocoding fails.

### Map layers

- Esri World Imagery provides satellite tiles.
- Esri World Boundaries and Places provides transparent place labels.
- Leaflet attribution remains visible.

### Search and reverse geocoding

Search requests use:

```text
/search?format=jsonv2&addressdetails=1&limit=5&q=<query>
```

Reverse requests use:

```text
/reverse?format=jsonv2&addressdetails=1&lat=<latitude>&lon=<longitude>
```

Locality selection prefers: city, town, village, municipality, county, state district, then state. Requests use `AbortController` so stale responses cannot overwrite newer selections.

### Map defaults

Priority is:

1. Existing controlled coordinates.
2. User-triggered browser geolocation.
3. Configured environment coordinates.
4. Central India fallback.

The marker is not shown until valid coordinates exist. The map recalculates its size with `invalidateSize()` and `ResizeObserver`, which is important inside modals and responsive containers.

## 11. Categories and property types

Category and type pages support paginated tables and modal create/edit forms. Both forms accept a name, description, status, and optional image. Existing images are displayed during editing; browser security prevents pre-populating file inputs.

Category submission requires a disclaimer confirming that the supplied information and image are accurate and authorized.

Property types currently refresh in the background every five seconds in addition to explicit refreshes after mutations.

## 12. Other screens

### Dashboard

Loads property data to calculate overall, pending, approved, rejected, and featured statistics and to show recent property information.

### Users

- Admins: paginated listing, search, and create modal.
- Sellers: listing with activation/deactivation controls.
- Customers: paginated customer listing and search.

### Amenities and facilities

These screens currently display paginated data. Although create service functions exist, creation/editing controls are not exposed on these pages.

### World

Provides tabbed, paginated views of countries, states, and districts, including parent and status information.

## 13. Styling and responsive behavior

Tailwind CSS is loaded from `src/index.css`. Inter is loaded from Google Fonts and applied globally. The app uses a blue primary theme, white cards, gray borders, responsive grids, modal overlays, and sticky headers/actions.

The dashboard sidebar becomes an overlay drawer on small screens and a collapsible rail on desktop. Tables use horizontal overflow where necessary. The property form switches from stacked mobile sections to wider desktop grids.

## 14. Error handling and notifications

The Axios response interceptor extracts `message` or `error` from failed backend responses and displays a toast. Individual screens also maintain local loading and error states.

When extending the code, avoid showing duplicate toasts from both the interceptor and component. Preserve caught errors when the UI needs to remain open after a failed mutation.

## 15. Development conventions

- Use functional components and hooks.
- Keep backend calls in `src/services/api.js`.
- Keep geocoding calls in `src/services/geocoding.js`.
- Accept both `id` and `_id` when consuming backend entities.
- Support the backend's varying nested response shapes when adding list screens.
- Use controlled form fields.
- Revoke object URLs created for media previews.
- Use `type="button"` for buttons that must not submit a form.
- Import global styles only from the app entry point.
- Keep secrets on the backend.

## 16. Build, lint, and testing

```bash
npm run build
npm run lint
```

There is currently no `test` script or automated test suite. Recommended future coverage includes:

- API response normalization.
- Selling and rental payload transformations.
- Coordinate validation.
- Nominatim stale-request cancellation.
- Property filtering and pagination.
- Authentication and protected routing.

## 17. Deployment

1. Configure production `VITE_API_BASE_URL`.
2. Prefer a backend geocoding proxy for production traffic.
3. Run `npm ci` and `npm run build`.
4. Publish `dist/` to a static host.
5. Configure SPA fallback so unknown paths serve `index.html`.
6. Ensure HTTPS; browser geolocation generally requires a secure context outside localhost.
7. Allow outbound HTTPS access to the backend, map tile services, and geocoding service.

Because `createBrowserRouter` uses normal browser paths, a missing SPA fallback will cause direct route refreshes such as `/properties` to return a server 404.

## 18. Known limitations and technical debt

- Dashboard routes do not have a frontend authentication guard.
- Expired or unauthorized sessions are not centrally redirected to login.
- Login contains verbose debug logging.
- The header search field is currently visual-only.
- Header notification and avatar controls are visual-only.
- Admin Edit has no handler, and Admin Delete only removes the row locally.
- Amenities and facilities pages are read-only.
- `NotFound.jsx` is not registered in the router.
- `PropertyModal` is not the primary property creation component.
- Some pages contain independent response-normalization helpers that could be consolidated.
- Property-type polling runs every five seconds.
- The application has no automated tests.
- The production JavaScript bundle currently triggers Vite's large-chunk warning; route-level lazy loading would reduce the initial bundle.

## 19. Troubleshooting

### API calls fail

- Confirm `VITE_API_BASE_URL`.
- Check that `localStorage.token` exists after login.
- Inspect the backend response and CORS configuration.
- Restart Vite after changing `.env`.

### Map does not render correctly

- Confirm Leaflet CSS is imported in `src/main.jsx`.
- Confirm external tile hosts are reachable.
- Ensure the map container has a nonzero height.
- Check browser console/network logs for blocked tile requests.

### Place search fails

- Confirm the configured Nominatim endpoint is reachable.
- Avoid sending a request on every keystroke.
- Verify a proxy preserves Nominatim JSON responses.
- Check country-code filtering if expected results are missing.

### Current location fails

- Serve the application over HTTPS or localhost.
- Confirm browser location permission.
- Manual map selection remains available after a geolocation failure.

### Direct route refresh returns 404

Configure the web server to serve `index.html` for application routes.

## 20. Recommended next steps

1. Add protected routes and centralized `401` handling.
2. Remove production debug logs.
3. Add lazy-loaded route chunks.
4. Add unit and interaction tests.
5. Complete admin edit/delete backend integration.
6. Add amenity and facility management forms.
7. Consolidate repeated API payload normalization.
8. Introduce a production geocoding proxy with caching and rate limiting.
