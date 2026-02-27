# Admin Panel Setup Guide

## Overview

The admin panel provides comprehensive platform management capabilities including user management, post moderation, report handling, and analytics.

## Admin Panel Features

### 1. Dashboard (`/admin`)
- Platform statistics (users, posts, applications, reports)
- Quick action buttons
- System health overview

### 2. User Management (`/admin/users`)
- View all users
- Search by username or email
- Grant/revoke premium status
- View user details and activity

### 3. Post Management (`/admin/posts`)
- View all posts
- Search and filter posts
- Boost posts (24h, 72h, 7 days)
- Feature/unfeature posts
- Delete posts

### 4. Report Management (`/admin/reports`)
- View all reports
- Filter by status (Pending, Reviewing, Resolved, Dismissed)
- Update report status
- Take moderation actions

### 5. Analytics (`/admin/analytics`)
- Coming soon: Detailed platform analytics

## Creating an Admin User

### Method 1: Using PostgreSQL (Recommended)

1. **Register a normal user first:**
   - Go to http://localhost:3003/register
   - Create an account with your desired credentials
   - Complete email verification (if enabled)

2. **Connect to PostgreSQL:**
   ```bash
   docker exec -it squadbul-postgres psql -U squadbul -d squadbul
   ```

3. **Make the user admin:**
   ```sql
   -- Replace 'your_username' with your actual username
   UPDATE users SET is_admin = true WHERE username = 'your_username';
   
   -- Or use email
   UPDATE users SET is_admin = true WHERE email = 'your@email.com';
   
   -- Verify admin users
   SELECT id, username, email, is_admin, created_at 
   FROM users 
   WHERE is_admin = true;
   
   -- Exit PostgreSQL
   \q
   ```

4. **Login and access admin panel:**
   - Login at http://localhost:3003/login
   - Navigate to http://localhost:3003/admin

### Method 2: Using SQL File

1. **Register a user first** (as above)

2. **Run the SQL script:**
   ```bash
   docker exec -i squadbul-postgres psql -U squadbul -d squadbul < backend/create-admin.sql
   ```

3. **Edit the SQL file** to specify your username/email before running

## Admin Access Control

### Backend Protection

Admin endpoints are protected by two guards:
- `JwtAuthGuard`: Ensures user is authenticated
- `AdminGuard`: Ensures user has `is_admin = true`

Protected endpoints:
```
POST   /api/v1/admin/users/:userId/premium
DELETE /api/v1/admin/users/:userId/premium
POST   /api/v1/admin/posts/:postId/boost
POST   /api/v1/admin/posts/:postId/feature
DELETE /api/v1/admin/posts/:postId/feature
GET    /api/v1/admin/stats
```

### Frontend Protection

Admin pages check authentication status and redirect to login if not authenticated. Additional backend validation ensures only admin users can access admin endpoints.

## Security Best Practices

1. **Never commit admin credentials** to version control
2. **Use strong passwords** for admin accounts
3. **Limit admin access** to trusted team members only
4. **Monitor admin actions** through activity logs
5. **Regular security audits** of admin accounts
6. **Enable 2FA** for admin accounts (Phase 2)

## Troubleshooting

### Cannot access admin panel

1. **Check if user is admin:**
   ```sql
   SELECT username, email, is_admin FROM users WHERE username = 'your_username';
   ```

2. **Check authentication:**
   - Ensure you're logged in
   - Check browser console for errors
   - Verify JWT token is valid

3. **Check backend logs:**
   ```bash
   docker logs squadbul-backend
   ```

### Admin endpoints return 403 Forbidden

- Verify `is_admin` field is `true` in database
- Check JWT token includes user data
- Ensure AdminGuard is properly configured

## Future Enhancements

- [ ] Role-based access control (RBAC)
- [ ] Admin activity logging
- [ ] Bulk user operations
- [ ] Advanced analytics dashboard
- [ ] Email notifications for admin actions
- [ ] Two-factor authentication (2FA)
- [ ] Admin audit trail
- [ ] Scheduled reports

## Support

For issues or questions:
- Check backend logs: `docker logs squadbul-backend`
- Check frontend console: Browser DevTools
- Review API documentation: http://localhost:3001/api/docs
