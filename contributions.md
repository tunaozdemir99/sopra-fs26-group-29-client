# Contributions

Every member has to complete at least 2 meaningful tasks per week, where a
single development task should have a granularity of 0.5-1 day. The completed
tasks have to be shown in the weekly TA meetings. You have one "Joker" to miss
one weekly TA meeting and another "Joker" to once skip continuous progress over
the remaining weeks of the course. Please note that you cannot make up for
"missed" continuous progress, but you can "work ahead" by completing twice the
amount of work in one week to skip progress on a subsequent week without using
your "Joker". Please communicate your planning **ahead of time**.

Note: If a team member fails to show continuous progress after using their
Joker, they will individually fail the overall course (unless there is a valid
reason).

**You MUST**:

- Have two meaningful contributions per week.

**You CAN**:

- Have more than one commit per contribution.
- Have more than two contributions per week.
- Link issues to contributions descriptions for better traceability.

**You CANNOT**:

- Link the same commit more than once.
- Use a commit authored by another GitHub user.

---

## Contributions Week 1 - 23.03.2026 to 31.03.2026

| **Student**        | **Date** | **Link to Commit** | **Description**                 | **Relevance**                       |
| ------------------ | -------- | ------------------ | ------------------------------- | ----------------------------------- |
| **[@adnana24i]** | 24.03.2026| https://github.com/tunaozdemir99/sopra-fs26-group-29-client/commit/eb89f28ff93b425fe4a1ff870c9739d1d15eb146 | Implemented login and logout for the frontend, including the redirections for errors | This completes the user story 2 |
|                    | 24.03.2026   | https://github.com/tunaozdemir99/sopra-fs26-group-29-server/commit/5d59dab41069bf58e503aa04cb5a78b06fce36df | Implemented integration tests for login and logout | This ensures correctitude of implementation of user story 2 |
|                    | 24.03.2026   | https://github.com/tunaozdemir99/sopra-fs26-group-29-server/commit/e87556ebef251449fba5819f43aebe5cd281b079 | Implemented login and logout user services | This is the main implementation of user story 2 |
| **[@tunaozdemir99]** | [30.03.2026]   | https://github.com/tunaozdemir99/sopra-fs26-group-29-server/commit/5edd447575d464d5b9bd39348ace5624341bcbbd | Created the BucketItem entity with its DTOs and mappings. | This task creates the foundation for the Idea Bucket which is a core feature of the project. |
|                    | [31.03.2026]   | https://github.com/tunaozdemir99/sopra-fs26-group-29-server/commit/486e4331e8b8d14d0f51386615e747142bb200f1 | Implemented the REST endpoints for Idea Bucket, with trip membership validation. | This enables usage of the Idea Bucket feature for trip members. |
|                    | [31.03.2026]   | https://github.com/tunaozdemir99/sopra-fs26-group-29-client/commit/ec32ee342efbb8dadba52581b717483c1cc5c16c | Built the Idea Bucket frontend page with a form to add new ideas, which refreshes every 5 seconds. Added bearer token authorization to all API requests. | This completes the client-side of the Idea Bucket feature and ensures that all client-side requests are properly authorized. |
| **[@dogamentese]** | 30.03.2026   | https://github.com/tunaozdemir99/sopra-fs26-group-29-server/commit/49a917cb52a64552d973a4735cf1653c9730448b | Fixed the login endpoint on the server side to enable users to successfully log in. | The login endpoint was incorrectly pointing to POST /users which is the registration endpoint so this was required to correctly implement registration. |
|                    | 30.03.2026   | https://github.com/tunaozdemir99/sopra-fs26-group-29-server/commit/54ea54a4f9c178b0f764df942e24085d6ed1a003 | Implemented the user registration endpoint on the server side with a check that prevents duplicate usernames from being registered. | This is the core backend implementation of user story 1 which enables new users to create accounts with unique usernames. |
|                    | 30.03.2026   | https://github.com/tunaozdemir99/sopra-fs26-group-29-server/commit/43fb49237ab73f848929c3839f5d41d52bb6b677 | Removed the name field for user. | This ensures that the user description fits the project requirements, and that the user data returned from the server is correctly structured. |
|                    | 30.03.2026   | https://github.com/tunaozdemir99/sopra-fs26-group-29-client/commit/5cdc3cc982e4f76421dbb96511f81487251d3da5 | Fixed bugs in the login form. | These fixes were necessary for any login-dependent feature to work. |
|                    | 30.03.2026   | https://github.com/tunaozdemir99/sopra-fs26-group-29-client/commit/bbb7b42f402c0975deb49bde366eab992c0fa002 | Implemented the client side registration flow, including redirecting the user to the dashboard on success and showing an error message on failure. | This completes the frontend side of user story 1, making the registration feature fully functional. |
| **[@stella-sy-x]** | [30.03.2026]   | https://github.com/tunaozdemir99/sopra-fs26-group-29-server/commit/5ed2064df9fd1d631b2653cf737c8998eb9c042f | Add Trip entity, repository, service, controller, DTOs and tests (#30) | Core backend for trip creation; enables S4 user story and unblocks all trip-related features |
|                    | [30.03.2026]   | https://github.com/tunaozdemir99/sopra-fs26-group-29-server/commit/2810893416b87a7de80fb55a253ddebc78671935 | Fix User tests: remove stale name references, add password, update status to ONLINE | Fixes ~25 broken tests caused by incomplete M1 cleanup, unblocks CI pipeline |
|                    | [30.03.2026]   | https://github.com/tunaozdemir99/sopra-fs26-group-29-server/commit/c7ed4207c44f929bba04437e5a778f1b24714ec1 | Set User token as nullable to fix logout logic | Resolves DB constraint conflict that prevented logout from working |
|                    | [30.03.2026]   | https://github.com/tunaozdemir99/sopra-fs26-group-29-server/commit/8871734c39e845e91036395f11e1bc2b35c82a8a | Add location field to Trip entity, DTOs, and mapper (#28) | Extends trip creation to support location data per issue requirements |

---

## Contributions Week 2 - 08.04.2026 to 14.04.2026

| **Student**        | **Date** | **Link to Commit** | **Description**                 | **Relevance**                       |
| ------------------ | -------- | ------------------ | ------------------------------- | ----------------------------------- |
| **[@stella-sy-x]** | 14.04.2026 | https://github.com/tunaozdemir99/sopra-fs26-group-29-server/commit/4122ca85a3fa7198f3b2b6a233a81029fe76e278 | Add member-only authorization check to trip dashboard endpoint (#51) | Enforces access control for S14 trip dashboard: non-members receive 403 per M2 API spec |
|                    | 14.04.2026 | https://github.com/tunaozdemir99/sopra-fs26-group-29-client/commit/011e6dc5b85d25b8cae62806cde022baa7a375d8 | Add trip dashboard page with trip overview, navigation tabs, and placeholder cards (#25) | Implements S14 frontend: central navigation hub for all trip-related features with clear extension points for pending user stories |
| **[@adnana24i]** | 14.04.2026 | https://github.com/tunaozdemir99/sopra-fs26-group-29-client/commit/ea1234053fb89e1809e388b2e2d87f67912796d3 | Added Create Trip button on the Dashboard
   and set up navigation redirects to support the trip creation flow | Completes the UI entry point for trip creation|                                               
  |                    | 14.04.2026 | https://github.com/tunaozdemir99/sopra-fs26-group-29-client/commit/51ffe01297f05ca87632410e04ed2b13baeddfbf | Implemented redirect from trip creation
   form to the Trip Overview page on success | Ensures easier navigation after creating a trip|                                                                    
  |                    | 14.04.2026 | https://github.com/tunaozdemir99/sopra-fs26-group-29-client/commit/4079725dd52b69ea486f99e51ec481aa634c782c | Built the full Timeline UI: display of
  scheduled activities, adding/deleting items, assigning from bucket, and showing travel time between stops | Core frontend for the trip planning timeline feature|
  |                    | 14.04.2026 | https://github.com/tunaozdemir99/sopra-fs26-group-29-client/commit/51c429046cfe7a7b0aac4f73981e3391ca83530b | Fixed auth token reading from          
  localStorage on app init and corrected parsing of JSON-wrapped tokens | Resolves authentication state persistence bugs|                                       
  |                    | 14.04.2026 | https://github.com/tunaozdemir99/sopra-fs26-group-29-client/commit/be0a27da5a4e5880cd192c49481ab386e5812d81 | Improved the Auth UI (login/register
  pages) and added proper error handling for server-side errors | Enhances user experience during authentication|                                            
  |                    | 14.04.2026 | https://github.com/tunaozdemir99/sopra-fs26-group-29-client/commit/da8b6ed967c4bb021cb0116dbb9ffee3abe6ba21 | Redesigned the Dashboard layout and the
   Trip creation form for better usability | Improves the main entry points of the app, fulfilling issues|                                                                         
  |                    | 14.04.2026 | https://github.com/tunaozdemir99/sopra-fs26-group-29-client/commit/64e64a7396d46e7d693414aa61e66527ec0d6d0a | Implemented the Trip Overview page with
   real-time Bucket display, Google Maps integration, and Geocoding for trip locations | Core frontend for viewing trip details |                           
  |                    | 14.04.2026 | https://github.com/tunaozdemir99/sopra-fs26-group-29-server/commit/a3fe0ee6f39d1b6290cf6f75cdf02ce290201e04 | Added GET /users/{userId}/trips
  endpoint to retrieve trips for a user | Enables the frontend to list user trips, supporting dashboard and navigation, fulfilling issues #7 #8 |                                          
  |                    | 14.04.2026 | https://github.com/tunaozdemir99/sopra-fs26-group-29-server/commit/739df2c7a9b3479195e6286e2eac5987481b137b | Implemented timeline REST endpoints:
  get daily timeline, schedule a bucket item as an activity, and delete an activity | Core backend for the timeline feature|                            
  |                    | 14.04.2026 | https://github.com/tunaozdemir99/sopra-fs26-group-29-server/commit/363521a3693d98cdc89908e034d8bd09c56eac65 | Integrated Google Maps Routes API to
  automatically calculate travel time between timeline activities | Enables travel time display in the timeline, fulfilling issues|                                           
  |                    | 14.04.2026 | https://github.com/tunaozdemir99/sopra-fs26-group-29-server/commit/4d8531dd18a10440bbbcc065fec67a904f69a7f2 | Implemented the full BucketItem service
   logic including CRUD operations and trip membership validation | Core backend for the Idea Bucket feature, fulfilling issues |                                                  
  |                    | 14.04.2026 | https://github.com/tunaozdemir99/sopra-fs26-group-29-server/commit/22a8445b479f6db962ea5cd1b308f658dff545e9 | Fixed a minor bug in the logout
  endpoint | Ensures users can log out correctly|                                                                                                                    
  |                    | 14.04.2026 | https://github.com/tunaozdemir99/sopra-fs26-group-29-server/commit/5eba61d6e63ba4e5ca646c5426d2389c7f751074 | Defined the BucketItem entity with its
  DTOs and mappings | Foundation for the Idea Bucket feature |  

| **[@githubUser3]** | [date]   | [Link to Commit 1] | [Brief description of the task] | [Why this contribution is relevant] |
|                    | [date]   | [Link to Commit 2] | [Brief description of the task] | [Why this contribution is relevant] |
| **[@githubUser4]** | [date]   | [Link to Commit 1] | [Brief description of the task] | [Why this contribution is relevant] |
|                    | [date]   | [Link to Commit 2] | [Brief description of the task] | [Why this contribution is relevant] |

---

## Contributions Week 3 - [Begin Date] to [End Date]

_Continue with the same table format as above._

---

## Contributions Week 4 - [Begin Date] to [End Date]

_Continue with the same table format as above._

---

## Contributions Week 5 - [Begin Date] to [End Date]

_Continue with the same table format as above._

---

## Contributions Week 6 - [Begin Date] to [End Date]

_Continue with the same table format as above._
