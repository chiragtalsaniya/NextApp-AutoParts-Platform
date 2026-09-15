# API Endpoints

This document lists the main REST endpoints provided by the backend. All routes are prefixed with `/api`.

| Method | Path | Auth | Description |
|-------|------|------|-------------|
| POST | /auth/login | none | User login |
| GET | /auth/profile | JWT | Current user profile |
| POST | /auth/change-password | JWT | Change current user password |
| POST | /auth/refresh | JWT | Issue new JWT token |

| GET | /companies | JWT | List companies |
| GET | /companies/:id | JWT | Company details |
| POST | /companies | super_admin | Create company |
| PUT | /companies/:id | super_admin | Update company |
| DELETE | /companies/:id | super_admin | Delete company |

| GET | /stores | JWT | List stores |
| GET | /stores/:branchCode | JWT | Store details |
| POST | /stores | super_admin, admin | Create store |
| PUT | /stores/:branchCode | super_admin, admin | Update store |
| DELETE | /stores/:branchCode | super_admin, admin | Delete store |

| GET | /retailers | JWT | List retailers |
| GET | /retailers/:id | JWT | Retailer details |
| POST | /retailers | super_admin, admin, manager | Create retailer |
| PUT | /retailers/:id | super_admin, admin, manager | Update retailer |
| PATCH | /retailers/:id/confirm | super_admin, admin, manager | Confirm retailer |
| PATCH | /retailers/:id/status | super_admin, admin, manager | Change retailer status |
| GET | /retailers/stats/summary | JWT | Retailer statistics |

| GET | /parts | JWT | List parts |
| GET | /parts/:partNumber | JWT | Part details |
| POST | /parts | super_admin, admin, manager | Create part |
| PUT | /parts/:partNumber | super_admin, admin, manager | Update part |
| PATCH | /parts/:partNumber/stock | super_admin, admin, manager, storeman | Update part stock |
| GET | /parts/meta/categories | JWT | List part categories |
| GET | /parts/meta/focus-groups | JWT | List focus groups |
| GET | /parts/alerts/low-stock | super_admin, admin, manager, storeman | Low stock parts |

| GET | /orders | JWT | List orders |
| GET | /orders/:id | JWT | Order details |
| POST | /orders | admin, manager, storeman, salesman | Create order |
| PATCH | /orders/:id/status | admin, manager, storeman | Update order status |
| GET | /orders/stats/summary | JWT | Order statistics |

| GET | /regions | JWT | List regions |
| GET | /regions/:id | JWT | Region details |
| POST | /regions | super_admin, admin, manager | Create region |
| PUT | /regions/:id | super_admin, admin, manager | Update region |
| DELETE | /regions/:id | super_admin, admin, manager | Delete region |

| GET | /reports/orders | super_admin, admin, manager | Order report |
| GET | /reports/inventory | super_admin, admin, manager, storeman | Inventory report |
| GET | /reports/sales | super_admin, admin, manager | Sales report |
| GET | /reports/retailers | super_admin, admin, manager | Retailer report |

| GET | /item-status | JWT | List item status |
| GET | /item-status/:branchCode/:partNo | JWT | Item status for part in store |
| POST | /item-status | super_admin, admin, manager, storeman | Create or update status |
| PATCH | /item-status/:branchCode/:partNo/stock | super_admin, admin, manager, storeman | Update stock levels |
| PATCH | /item-status/:branchCode/:partNo/rack | super_admin, admin, manager, storeman | Update rack location |
| POST | /item-status/:branchCode/:partNo/sale | super_admin, admin, manager, storeman | Record sale transaction |
| POST | /item-status/:branchCode/:partNo/purchase | super_admin, admin, manager, storeman | Record purchase transaction |
| GET | /item-status/alerts/low-stock | super_admin, admin, manager, storeman | Low stock items |
| GET | /item-status/stats/:branchCode | JWT | Item status statistics |

| GET | /users | JWT | List users |
| GET | /users/:id | JWT | User details |
| POST | /users | super_admin, admin, manager | Create user |
| PUT | /users/:id | super_admin, admin, manager | Update user |
| DELETE | /users/:id | super_admin, admin | Delete user |
| PATCH | /users/:id/status | super_admin, admin, manager | Activate/deactivate user |
| GET | /users/stats/summary | super_admin, admin | User statistics |


