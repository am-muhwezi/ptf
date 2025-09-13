# Membership Services API Reference

## 🎯 Service Architecture Overview

This document outlines the **clean, modular service architecture** implemented to eliminate duplicate API calls and provide clear separation of concerns.

### **Service Responsibilities**

| Service | Purpose | When to Use |
|---------|---------|-------------|
| `indoorMembershipService` | Indoor membership operations only | IndoorMemberships component |
| `outdoorMembershipService` | Outdoor membership operations only | OutdoorMemberships component |
| `memberService` | Cross-cutting member operations (create, update, delete) | Any component that needs CRUD operations |

---

## 🔵 IndoorMembershipService

**Import:** `import indoorMembershipService from '../services/indoorMembershipService';`

### `getAll(params)`

**Purpose:** Get all indoor membership data (members + stats) in one call

**Parameters:**
```typescript
interface IndoorParams {
  page?: number;        // Default: 1
  limit?: number;       // Default: 20  
  search?: string;      // Optional search term
  status?: string;      // Optional status filter ('active', 'expired', 'suspended')
}
```

**Returns:**
```typescript
interface IndoorMembershipData {
  success: boolean;
  members: {
    data: Member[];           // Array of transformed member objects
    count: number;            // Total member count
    next: string | null;      // Next page URL
    previous: string | null;  // Previous page URL
  };
  stats: {
    total_memberships: number;
    active_memberships: number;
    expiring_soon: number;
    total_revenue: number;
  };
}
```

**Usage:**
```javascript
// ✅ Correct Usage - Indoor Memberships Component
const loadData = async () => {
  const response = await indoorMembershipService.getAll({
    page: 1,
    limit: 20,
    search: searchTerm,
    status: filterStatus !== 'all' ? filterStatus : undefined
  });
  
  if (response.success) {
    setMembers(response.members.data);
    setStats(response.stats);
  }
};
```

### `renewMembership(membershipId, renewalData)`
### `suspendMember(membershipId, reason)`

---

## 🟠 OutdoorMembershipService

**Import:** `import outdoorMembershipService from '../services/outdoorMembershipService';`

### `getAll(params)`

**Purpose:** Get all outdoor membership data (members + stats) in one call

**Parameters:**
```typescript
interface OutdoorParams {
  page?: number;        // Default: 1
  limit?: number;       // Default: 50 (higher for local filtering)
  search?: string;      // Optional search term  
  status?: string;      // Optional status filter
}
```

**Returns:**
```typescript
interface OutdoorMembershipData {
  success: boolean;
  members: {
    data: Member[];           // Array of transformed member objects
    count: number;            // Total member count
    next: string | null;      // Next page URL
    previous: string | null;  // Previous page URL
  };
  stats: {
    total_memberships: number;
    active_memberships: number;
    // ... outdoor-specific stats
  };
  // Note: Rate cards are hardcoded in the frontend, not fetched from API
}
```

**Usage:**
```javascript
// ✅ Correct Usage - Outdoor Memberships Component
const loadData = async () => {
  const response = await outdoorMembershipService.getAll({
    page: currentPage,
    limit: 50
  });
  
  if (response.success) {
    setMembers(response.members.data);
    setStats(response.stats);
    // Rate cards are handled separately (hardcoded)
  }
};
```

### `useSession(membershipId, sessionData)`

---

## ⚪ MemberService (Cross-Cutting Operations)

**Import:** `import { memberService } from '../services/memberService';`

### `createMember(memberData)`

**Purpose:** Create new members for ANY membership type

**Parameters:**
```typescript
interface CreateMemberData {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  membership_type: 'indoor' | 'outdoor';  // REQUIRED
  plan_type: string;
  // ... other member fields
}
```

**Usage:**
```javascript
// ✅ Correct Usage - Any Component
const createMember = async (memberData) => {
  const memberWithType = {
    ...memberData,
    membership_type: 'indoor' // or 'outdoor'
  };
  
  await memberService.createMember(memberWithType);
};
```

### `getMembers(params)` - For All Members List
### `updateMember(id, data)`
### `deleteMember(id)`

---

## 🚨 Important Rules

### ✅ DO's

1. **Use the right service for the right component:**
   - `IndoorMemberships.jsx` → `indoorMembershipService.getAll()`
   - `OutdoorMemberships.jsx` → `outdoorMembershipService.getAll()`
   - `AllMembers.jsx` → `memberService.getMembers()`

2. **One API call per page load:**
   ```javascript
   useEffect(() => {
     const loadData = async () => {
       const response = await indoorMembershipService.getAll(params);
       // Handle response...
     };
     loadData();
   }, [currentPage, searchTerm, filterStatus]);
   ```

3. **Use proper dependency arrays:**
   - Include all variables used inside useEffect
   - Let React handle when to re-run the effect

4. **Handle React StrictMode correctly:**
   - StrictMode will double-run effects in development (this is normal!)
   - Use cleanup functions to prevent race conditions
   - Never try to "fix" StrictMode by removing it

### ❌ DON'Ts

1. **Never mix services:**
   ```javascript
   // ❌ Wrong - Don't mix services
   await memberService.getMembers(); 
   await indoorMembershipService.getAll();
   
   // ✅ Right - Use one appropriate service
   await indoorMembershipService.getAll();
   ```

2. **Don't use deprecated methods:**
   ```javascript
   // ❌ Deprecated - These methods are removed
   membershipService.getIndoorMembers();
   membershipService.getIndoorMemberships(); 
   membershipService.getOutdoorMembers();
   
   // ✅ Use new unified methods  
   indoorMembershipService.getAll();
   outdoorMembershipService.getAll();
   ```

3. **Don't create multiple useEffects for the same data:**
   ```javascript
   // ❌ Wrong - Multiple effects loading same data
   useEffect(() => { loadMembers(); }, []);
   useEffect(() => { loadStats(); }, []);
   
   // ✅ Right - Single effect loads all needed data
   useEffect(() => { 
     const response = await indoorMembershipService.getAll();
     setMembers(response.members.data);
     setStats(response.stats);
   }, []);
   ```

---

## 🧪 Testing & Debugging

### Console Logging

The services include console logging to help debug API calls:

```javascript
// You'll see these in browser console:
🔵 IndoorService.getAll() called: 1
🔵 IndoorService.getAll() params: {page: 1, limit: 20}

🟠 OutdoorService.getAll() called: 1  
🟠 OutdoorService.getAll() params: {page: 1, limit: 50}
```

### Expected Behavior

**Development (with StrictMode):**
- Each service method may be called **twice** on component mount
- This is normal React behavior for detecting side effects
- Should not cause issues if cleanup is implemented correctly

**Production:**
- Each service method called **once** per dependency change
- No duplicate calls should occur

---

## 🔧 Migration Guide

If you're working with legacy code, here's how to migrate:

### Before (Old Pattern)
```javascript
// ❌ Old duplicate pattern
useEffect(() => {
  loadMembers();
  loadStats(); 
}, []);

useEffect(() => {
  if (searchTerm) loadMembers();
}, [searchTerm]);
```

### After (New Clean Pattern)  
```javascript
// ✅ New unified pattern
useEffect(() => {
  const loadData = async () => {
    const response = await indoorMembershipService.getAll({
      page: currentPage,
      search: searchTerm,
      status: filterStatus !== 'all' ? filterStatus : undefined
    });
    
    if (response.success) {
      setMembers(response.members.data);
      setStats(response.stats);
    }
  };
  
  loadData();
}, [currentPage, searchTerm, filterStatus]);
```

---

## 📚 Additional Resources

- **React useEffect Guide:** Understanding dependency arrays and cleanup
- **AbortController:** Preventing race conditions in API calls
- **React StrictMode:** Why double-calling effects is beneficial

---

*Generated by Senior Full-Stack Engineer AI Assistant*
*Last Updated: 2024*