# 📱 Complete Mobile App Development Guide
## From Zero to Demo - Step by Step

> **For Complete Beginners**: This guide assumes you've never built a mobile app before. Follow every step exactly as written.

---

## 🎯 What We're Building

**School Bus Tracking Mobile App** with 3 components:
- 📱 **Parent App** - Track your child's bus in real-time
- 🚌 **Bus Minder App** - Mark attendance and manage students
- 💻 **Admin Web Dashboard** - Manage entire bus fleet

---

## 🛠️ PART 1: Setup Your Development Environment

### Step 1: Install Required Software

#### A. Install Node.js (JavaScript Runtime)
1. Go to [nodejs.org](https://nodejs.org)
2. Download the **LTS version** (Long Term Support)
3. Run the installer and follow prompts
4. **Test installation**:
   ```bash
   node --version
   npm --version
   ```
   - You should see version numbers (e.g., `v18.17.0`)

#### B. Install Git (Version Control)
1. Go to [git-scm.com](https://git-scm.com)
2. Download and install for your operating system
3. **Test installation**:
   ```bash
   git --version
   ```

#### C. Install Visual Studio Code (Code Editor)
1. Go to [code.visualstudio.com](https://code.visualstudio.com)
2. Download and install
3. **Install helpful extensions**:
   - React Native Tools
   - ES7+ React/Redux/React-Native snippets
   - Prettier - Code formatter
   - Auto Rename Tag

#### D. Install Expo CLI (React Native Development)
```bash
npm install -g @expo/cli
```

**Test installation**:
```bash
expo --version
```

---

## 🚀 PART 2: Create Your Mobile Apps

### Step 2: Create Parent App

#### A. Create New Expo Project
```bash
# Navigate to your projects folder
cd Desktop
mkdir SchoolBusApp
cd SchoolBusApp

# Create parent app
npx create-expo-app ParentApp --template blank
cd ParentApp
```

#### B. Install Required Packages
```bash
# Navigation and UI
npm install @react-navigation/native @react-navigation/stack
npm install react-native-screens react-native-safe-area-context

# Maps and Location
npm install react-native-maps expo-location

# State Management and HTTP
npm install axios @react-native-async-storage/async-storage

# Notifications
npm install expo-notifications

# Icons and UI Components
npm install react-native-vector-icons @expo/vector-icons
```

#### C. Basic App Structure
Create the following folders in your `ParentApp` directory:
```
ParentApp/
├── src/
│   ├── components/
│   ├── screens/
│   ├── services/
│   ├── utils/
│   └── navigation/
├── assets/
└── App.js
```

#### D. Create Parent App Core Files

**1. Create `src/screens/LoginScreen.js`:**
```javascript
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  SafeAreaView
} from 'react-native';

const LoginScreen = ({ navigation }) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [studentCode, setStudentCode] = useState('');

  const handleLogin = () => {
    if (!phoneNumber || !studentCode) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    
    // Demo login - always succeeds
    navigation.navigate('Dashboard');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>🚌 School Bus Tracker</Text>
        <Text style={styles.subtitle}>Parent Login</Text>
        
        <TextInput
          style={styles.input}
          placeholder="Phone Number (e.g., 0700123456)"
          value={phoneNumber}
          onChangeText={setPhoneNumber}
          keyboardType="phone-pad"
        />
        
        <TextInput
          style={styles.input}
          placeholder="Student Code (e.g., STU001)"
          value={studentCode}
          onChangeText={setStudentCode}
          autoCapitalize="characters"
        />
        
        <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
          <Text style={styles.loginButtonText}>Login</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    color: '#2c3e50',
  },
  subtitle: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 40,
    color: '#7f8c8d',
  },
  input: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#ddd',
    fontSize: 16,
  },
  loginButton: {
    backgroundColor: '#3498db',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
  },
  loginButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default LoginScreen;
```

**2. Create `src/screens/DashboardScreen.js`:**
```javascript
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';

const DashboardScreen = () => {
  const [busLocation, setBusLocation] = useState({
    latitude: -1.2921,
    longitude: 36.8219,
  });
  const [refreshing, setRefreshing] = useState(false);
  const [busStatus, setBusStatus] = useState('On Route to School');
  const [estimatedArrival, setEstimatedArrival] = useState('15 min');
  const [studentStatus, setStudentStatus] = useState('Not Checked In');

  // Simulate bus movement
  useEffect(() => {
    const interval = setInterval(() => {
      setBusLocation(prev => ({
        latitude: prev.latitude + (Math.random() - 0.5) * 0.001,
        longitude: prev.longitude + (Math.random() - 0.5) * 0.001,
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    // Simulate API call
    setTimeout(() => {
      setRefreshing(false);
      Alert.alert('Updated', 'Bus location updated!');
    }, 2000);
  };

  const sendEmergencyAlert = () => {
    Alert.alert(
      'Emergency Alert',
      'Emergency alert sent to school and bus driver!',
      [{ text: 'OK' }]
    );
  };

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Status Cards */}
      <View style={styles.statusContainer}>
        <View style={styles.statusCard}>
          <Text style={styles.statusTitle}>Bus Status</Text>
          <Text style={styles.statusValue}>{busStatus}</Text>
        </View>
        
        <View style={styles.statusCard}>
          <Text style={styles.statusTitle}>ETA</Text>
          <Text style={styles.statusValue}>{estimatedArrival}</Text>
        </View>
        
        <View style={styles.statusCard}>
          <Text style={styles.statusTitle}>Student Status</Text>
          <Text style={[
            styles.statusValue,
            { color: studentStatus === 'Checked In' ? '#27ae60' : '#e74c3c' }
          ]}>
            {studentStatus}
          </Text>
        </View>
      </View>

      {/* Map */}
      <View style={styles.mapContainer}>
        <Text style={styles.sectionTitle}>🗺️ Live Bus Location</Text>
        <MapView
          style={styles.map}
          region={{
            latitude: busLocation.latitude,
            longitude: busLocation.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }}
        >
          <Marker
            coordinate={busLocation}
            title="School Bus"
            description="Bus #001"
            pinColor="red"
          />
        </MapView>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity 
          style={[styles.actionButton, { backgroundColor: '#e74c3c' }]}
          onPress={sendEmergencyAlert}
        >
          <Text style={styles.actionButtonText}>🚨 Emergency Alert</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  statusContainer: {
    flexDirection: 'row',
    padding: 15,
    justifyContent: 'space-between',
  },
  statusCard: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    flex: 1,
    marginHorizontal: 5,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusTitle: {
    fontSize: 12,
    color: '#7f8c8d',
    marginBottom: 5,
  },
  statusValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2c3e50',
    textAlign: 'center',
  },
  mapContainer: {
    margin: 15,
    marginTop: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#2c3e50',
  },
  map: {
    height: 300,
    borderRadius: 10,
  },
  actionsContainer: {
    padding: 15,
  },
  actionButton: {
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default DashboardScreen;
```

**3. Create `src/navigation/AppNavigation.js`:**
```javascript
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import LoginScreen from '../screens/LoginScreen';
import DashboardScreen from '../screens/DashboardScreen';

const Stack = createStackNavigator();

const AppNavigation = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Login"
        screenOptions={{
          headerStyle: {
            backgroundColor: '#3498db',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        <Stack.Screen 
          name="Login" 
          component={LoginScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="Dashboard" 
          component={DashboardScreen}
          options={{ 
            title: 'Bus Tracker',
            headerLeft: null, // Prevent going back
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigation;
```

**4. Update `App.js`:**
```javascript
import React from 'react';
import AppNavigation from './src/navigation/AppNavigation';

export default function App() {
  return <AppNavigation />;
}
```

### Step 3: Create Bus Minder App

#### A. Create Bus Minder App
```bash
# Go back to main folder
cd ..

# Create bus minder app
npx create-expo-app BusMinderApp --template blank
cd BusMinderApp

# Install same packages as parent app
npm install @react-navigation/native @react-navigation/stack
npm install react-native-screens react-native-safe-area-context
npm install axios @react-native-async-storage/async-storage
npm install @expo/vector-icons
```

#### B. Create Bus Minder Core Files

**1. Create `src/screens/StudentListScreen.js`:**
```javascript
import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  SafeAreaView,
} from 'react-native';

const StudentListScreen = () => {
  const [students, setStudents] = useState([
    { id: '1', name: 'John Doe', grade: 'Grade 5', status: 'absent', photo: '👦' },
    { id: '2', name: 'Jane Smith', grade: 'Grade 4', status: 'present', photo: '👧' },
    { id: '3', name: 'Mike Johnson', grade: 'Grade 6', status: 'absent', photo: '👦' },
    { id: '4', name: 'Sarah Wilson', grade: 'Grade 3', status: 'present', photo: '👧' },
    { id: '5', name: 'David Brown', grade: 'Grade 5', status: 'absent', photo: '👦' },
  ]);

  const toggleAttendance = (studentId) => {
    setStudents(prevStudents =>
      prevStudents.map(student =>
        student.id === studentId
          ? { ...student, status: student.status === 'present' ? 'absent' : 'present' }
          : student
      )
    );
  };

  const markAllPresent = () => {
    Alert.alert(
      'Mark All Present',
      'Are you sure you want to mark all students as present?',
      [
        { text: 'Cancel' },
        {
          text: 'Yes',
          onPress: () => {
            setStudents(prev => prev.map(s => ({ ...s, status: 'present' })));
            Alert.alert('Success', 'All students marked present!');
          }
        }
      ]
    );
  };

  const renderStudent = ({ item }) => (
    <TouchableOpacity 
      style={[
        styles.studentCard,
        { borderLeftColor: item.status === 'present' ? '#27ae60' : '#e74c3c' }
      ]}
      onPress={() => toggleAttendance(item.id)}
    >
      <View style={styles.studentInfo}>
        <Text style={styles.studentPhoto}>{item.photo}</Text>
        <View style={styles.studentDetails}>
          <Text style={styles.studentName}>{item.name}</Text>
          <Text style={styles.studentGrade}>{item.grade}</Text>
        </View>
      </View>
      <View style={[
        styles.statusBadge,
        { backgroundColor: item.status === 'present' ? '#27ae60' : '#e74c3c' }
      ]}>
        <Text style={styles.statusText}>
          {item.status === 'present' ? '✓' : '✗'}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const presentCount = students.filter(s => s.status === 'present').length;
  const totalCount = students.length;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header Stats */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>📋 Student Attendance</Text>
        <Text style={styles.headerStats}>
          Present: {presentCount}/{totalCount}
        </Text>
      </View>

      {/* Quick Actions */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity style={styles.actionButton} onPress={markAllPresent}>
          <Text style={styles.actionButtonText}>✓ Mark All Present</Text>
        </TouchableOpacity>
      </View>

      {/* Students List */}
      <FlatList
        data={students}
        renderItem={renderStudent}
        keyExtractor={item => item.id}
        style={styles.studentsList}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: 'white',
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  headerStats: {
    fontSize: 16,
    color: '#7f8c8d',
    marginTop: 5,
  },
  actionsContainer: {
    padding: 15,
  },
  actionButton: {
    backgroundColor: '#27ae60',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  studentsList: {
    flex: 1,
    paddingHorizontal: 15,
  },
  studentCard: {
    backgroundColor: 'white',
    padding: 15,
    marginBottom: 10,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  studentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  studentPhoto: {
    fontSize: 30,
    marginRight: 15,
  },
  studentDetails: {
    flex: 1,
  },
  studentName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  studentGrade: {
    fontSize: 14,
    color: '#7f8c8d',
    marginTop: 2,
  },
  statusBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default StudentListScreen;
```

**2. Create `App.js` for Bus Minder:**
```javascript
import React from 'react';
import StudentListScreen from './src/screens/StudentListScreen';

export default function App() {
  return <StudentListScreen />;
}
```

### Step 4: Create Admin Web Dashboard

#### A. Create Admin Dashboard
```bash
# Go back to main folder
cd ..

# Create admin dashboard with Vite
npm create vite@latest AdminDashboard -- --template react
cd AdminDashboard
npm install

# Install additional packages
npm install axios recharts react-router-dom
```

#### B. Create Admin Dashboard Files

**1. Create `src/components/BusTrackingDashboard.jsx`:**
```javascript
import React, { useState, useEffect } from 'react';
import './BusTrackingDashboard.css';

const BusTrackingDashboard = () => {
  const [buses, setBuses] = useState([
    {
      id: 'BUS001',
      driver: 'John Driver',
      route: 'Route A',
      status: 'On Route',
      studentsTotal: 25,
      studentsPresent: 23,
      location: 'Karen Shopping Center',
      nextStop: 'Brookside School',
      estimatedArrival: '15 min'
    },
    {
      id: 'BUS002',
      driver: 'Mary Transport',
      route: 'Route B',
      status: 'At School',
      studentsTotal: 30,
      studentsPresent: 28,
      location: 'Brookside School',
      nextStop: 'Karen Residential',
      estimatedArrival: '2 min'
    },
    {
      id: 'BUS003',
      driver: 'Paul Wilson',
      route: 'Route C',
      status: 'Loading',
      studentsTotal: 20,
      studentsPresent: 18,
      location: 'Lavington Mall',
      nextStop: 'Brookside School',
      estimatedArrival: '25 min'
    }
  ]);

  const [notifications, setNotifications] = useState([
    { id: 1, message: 'BUS001: Student John Doe checked in', time: '2 min ago', type: 'info' },
    { id: 2, message: 'BUS002: Arrived at Brookside School', time: '5 min ago', type: 'success' },
    { id: 3, message: 'BUS003: Emergency alert from parent', time: '10 min ago', type: 'warning' },
  ]);

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setBuses(prevBuses => 
        prevBuses.map(bus => ({
          ...bus,
          estimatedArrival: Math.max(0, parseInt(bus.estimatedArrival) - 1) + ' min'
        }))
      );
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'On Route': return '#3498db';
      case 'At School': return '#27ae60';
      case 'Loading': return '#f39c12';
      default: return '#95a5a6';
    }
  };

  const handleEmergencyAlert = (busId) => {
    alert(`Emergency protocol activated for ${busId}. Notifications sent to relevant parties.`);
  };

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>🚌 School Bus Management Dashboard</h1>
        <div className="header-stats">
          <div className="stat">
            <span className="stat-number">3</span>
            <span className="stat-label">Active Buses</span>
          </div>
          <div className="stat">
            <span className="stat-number">75</span>
            <span className="stat-label">Total Students</span>
          </div>
          <div className="stat">
            <span className="stat-number">69</span>
            <span className="stat-label">Present Today</span>
          </div>
        </div>
      </header>

      <div className="dashboard-content">
        {/* Bus Fleet Overview */}
        <section className="buses-section">
          <h2>🚐 Bus Fleet Status</h2>
          <div className="buses-grid">
            {buses.map(bus => (
              <div key={bus.id} className="bus-card">
                <div className="bus-header">
                  <h3>{bus.id}</h3>
                  <span 
                    className="status-badge"
                    style={{ backgroundColor: getStatusColor(bus.status) }}
                  >
                    {bus.status}
                  </span>
                </div>
                
                <div className="bus-details">
                  <p><strong>Driver:</strong> {bus.driver}</p>
                  <p><strong>Route:</strong> {bus.route}</p>
                  <p><strong>Location:</strong> {bus.location}</p>
                  <p><strong>Next Stop:</strong> {bus.nextStop}</p>
                  <p><strong>ETA:</strong> {bus.estimatedArrival}</p>
                  
                  <div className="attendance-info">
                    <span>👥 Students: {bus.studentsPresent}/{bus.studentsTotal}</span>
                    <div className="progress-bar">
                      <div 
                        className="progress-fill"
                        style={{ width: `${(bus.studentsPresent / bus.studentsTotal) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
                
                <div className="bus-actions">
                  <button className="btn-secondary">📍 Track</button>
                  <button 
                    className="btn-danger"
                    onClick={() => handleEmergencyAlert(bus.id)}
                  >
                    🚨 Emergency
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Notifications Panel */}
        <section className="notifications-section">
          <h2>🔔 Recent Notifications</h2>
          <div className="notifications-list">
            {notifications.map(notification => (
              <div key={notification.id} className={`notification ${notification.type}`}>
                <span className="notification-message">{notification.message}</span>
                <span className="notification-time">{notification.time}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default BusTrackingDashboard;
```

**2. Create `src/components/BusTrackingDashboard.css`:**
```css
.dashboard {
  min-height: 100vh;
  background-color: #f8f9fa;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.dashboard-header {
  background: linear-gradient(135deg, #3498db, #2980b9);
  color: white;
  padding: 2rem;
  text-align: center;
}

.dashboard-header h1 {
  margin: 0 0 1rem 0;
  font-size: 2.5rem;
  font-weight: bold;
}

.header-stats {
  display: flex;
  justify-content: center;
  gap: 3rem;
  margin-top: 1rem;
}

.stat {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-number {
  font-size: 2rem;
  font-weight: bold;
  color: #ecf0f1;
}

.stat-label {
  font-size: 0.9rem;
  opacity: 0.9;
}

.dashboard-content {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.buses-section h2,
.notifications-section h2 {
  color: #2c3e50;
  margin-bottom: 1.5rem;
  font-size: 1.8rem;
}

.buses-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 1.5rem;
  margin-bottom: 3rem;
}

.bus-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  border: 1px solid #e1e8ed;
  transition: transform 0.2s, box-shadow 0.2s;
}

.bus-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 15px rgba(0, 0, 0, 0.15);
}

.bus-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #ecf0f1;
}

.bus-header h3 {
  margin: 0;
  color: #2c3e50;
  font-size: 1.3rem;
}

.status-badge {
  padding: 0.3rem 0.8rem;
  border-radius: 20px;
  color: white;
  font-size: 0.8rem;
  font-weight: bold;
  text-transform: uppercase;
}

.bus-details p {
  margin: 0.5rem 0;
  color: #34495e;
  font-size: 0.9rem;
}

.attendance-info {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #ecf0f1;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background-color: #ecf0f1;
  border-radius: 4px;
  margin-top: 0.5rem;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #27ae60, #2ecc71);
  transition: width 0.3s ease;
}

.bus-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #ecf0f1;
}

.btn-secondary,
.btn-danger {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: bold;
  font-size: 0.85rem;
  transition: all 0.2s;
}

.btn-secondary {
  background-color: #3498db;
  color: white;
}

.btn-secondary:hover {
  background-color: #2980b9;
}

.btn-danger {
  background-color: #e74c3c;
  color: white;
}

.btn-danger:hover {
  background-color: #c0392b;
}

.notifications-section {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.notifications-list {
  space-y: 0.5rem;
}

.notification {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-radius: 8px;
  border-left: 4px solid;
  margin-bottom: 0.5rem;
}

.notification.info {
  background-color: #e3f2fd;
  border-left-color: #2196f3;
}

.notification.success {
  background-color: #e8f5e8;
  border-left-color: #4caf50;
}

.notification.warning {
  background-color: #fff3e0;
  border-left-color: #ff9800;
}

.notification-message {
  flex: 1;
  color: #2c3e50;
  font-weight: 500;
}

.notification-time {
  color: #7f8c8d;
  font-size: 0.8rem;
}

/* Responsive Design */
@media (max-width: 768px) {
  .dashboard-header {
    padding: 1rem;
  }
  
  .dashboard-header h1 {
    font-size: 1.8rem;
  }
  
  .header-stats {
    gap: 1.5rem;
  }
  
  .dashboard-content {
    padding: 1rem;
  }
  
  .buses-grid {
    grid-template-columns: 1fr;
  }
  
  .bus-actions {
    flex-direction: column;
  }
}
```

**3. Update `src/App.jsx`:**
```javascript
import React from 'react';
import BusTrackingDashboard from './components/BusTrackingDashboard';
import './App.css';

function App() {
  return (
    <div className="App">
      <BusTrackingDashboard />
    </div>
  );
}

export default App;
```

---

## 🚀 PART 3: Testing Your Apps

### Step 5: Test Parent App

```bash
# Navigate to ParentApp folder
cd ParentApp

# Start the development server
npx expo start
```

**What you'll see:**
- QR code in terminal
- Metro bundler webpage opens
- Download **Expo Go** app on your phone
- Scan QR code to test on real device

**Testing checklist:**
- ✅ Login screen appears with school bus emoji
- ✅ Enter any phone number and student code
- ✅ Tap login → Dashboard appears
- ✅ Map shows with red bus marker
- ✅ Bus marker moves every 5 seconds
- ✅ Status cards show bus information
- ✅ Emergency button shows alert

### Step 6: Test Bus Minder App

```bash
# Open new terminal, navigate to BusMinderApp
cd ../BusMinderApp

# Start the development server
npx expo start
```

**Testing checklist:**
- ✅ Student list appears with photos (emojis)
- ✅ Tap any student → status changes (green ✓ or red ✗)
- ✅ "Present: X/5" counter updates
- ✅ "Mark All Present" button works
- ✅ All students show green checkmarks

### Step 7: Test Admin Dashboard

```bash
# Open new terminal, navigate to AdminDashboard  
cd ../AdminDashboard

# Start the development server
npm run dev
```

**Open in browser:** `http://localhost:5173`

**Testing checklist:**
- ✅ Blue header with bus emoji and stats
- ✅ Three bus cards show different statuses
- ✅ Progress bars show student attendance
- ✅ Track and Emergency buttons work
- ✅ Notifications panel shows recent activity
- ✅ Hover effects on bus cards

---

## 📱 PART 4: Building for Demo

### Step 8: Create Demo APKs (Android)

#### A. Build Parent App APK
```bash
cd ParentApp

# Build for Android
expo build:android

# Or use newer EAS Build (recommended)
npm install -g @expo/eas-cli
eas build -p android
```

#### B. Build Bus Minder App APK
```bash
cd ../BusMinderApp
eas build -p android
```

### Step 9: Deploy Admin Dashboard

#### A. Build for Production
```bash
cd ../AdminDashboard
npm run build
```

#### B. Deploy to Netlify (Free)
1. Go to [netlify.com](https://netlify.com)
2. Sign up for free account
3. Drag and drop your `dist` folder
4. Get live URL: `https://your-app.netlify.app`

---

## 🎯 PART 5: Demo Presentation Setup

### Step 10: Prepare Demo Environment

#### A. Create Demo Script

**Create `DEMO_SCRIPT.md`:**
```markdown
# 🚌 School Bus Tracker Demo Script

## Demo Setup (5 minutes before presentation)
1. ✅ Phone 1: Parent App opened to login screen
2. ✅ Phone 2: Bus Minder App showing student list  
3. ✅ Laptop: Admin Dashboard open in browser
4. ✅ Internet connection tested
5. ✅ Screen mirroring/projector working

## Presentation Flow (10 minutes total)

### Part 1: Admin Dashboard (3 minutes)
**Story:** "School administrator monitoring bus fleet"
- Show 3 active buses with real-time locations
- Point out student attendance tracking (69/75 present)
- Demonstrate emergency alert system
- Highlight notifications panel

### Part 2: Bus Minder App (3 minutes)  
**Story:** "Bus attendant checking student attendance"
- Show student roster with photos
- Demonstrate tap-to-check-in functionality
- Show attendance counter updating (Present: 4/5)
- Use "Mark All Present" for efficiency

### Part 3: Parent App (3 minutes)
**Story:** "Parent tracking their child's bus"
- Login with demo credentials
- Show real-time bus location on map
- Point out ETA and student status
- Demonstrate emergency alert button

### Part 4: Q&A (1 minute)
**Common Questions:**
- "Does it work offline?" → "Basic features yes, tracking needs internet"  
- "How accurate is GPS?" → "Within 3-5 meters in open areas"
- "What about data costs?" → "Very minimal, mostly location updates"
```

#### B. Create Demo Data

**Test Credentials:**
- Phone: `0700123456`
- Student Code: `STU001` 
- These always work in demo mode

#### C. Backup Plans
1. **Internet fails:** Use screen recordings
2. **Phone crashes:** Have screenshots ready  
3. **Questions arise:** Refer to feature checklist

### Step 11: Demo Day Checklist

**Technical Setup:**
- [ ] Parent App APK installed on Phone 1
- [ ] Bus Minder App APK installed on Phone 2  
- [ ] Admin Dashboard URL bookmarked
- [ ] Screen mirroring tested
- [ ] Phones charged (80%+)
- [ ] Demo script printed

**Presentation Materials:**
- [ ] Business value slides ready
- [ ] Technical architecture diagram
- [ ] Cost breakdown and timeline
- [ ] Next steps and implementation plan

**Demo Flow:**
- [ ] 2 minutes: Problem statement
- [ ] 8 minutes: Live app demonstration  
- [ ] 5 minutes: Technical overview
- [ ] 5 minutes: Business benefits and ROI

---

## 🔧 PART 6: Troubleshooting Common Issues

### Problem: "Metro bundler won't start"
**Solution:**
```bash
# Clear cache
npx expo start --clear

# Or reset everything  
rm -rf node_modules
npm install
npx expo start
```

### Problem: "App crashes on phone"
**Solutions:**
1. Check Expo Go app is updated
2. Restart phone and try again  
3. Use tunnel connection: `npx expo start --tunnel`

### Problem: "Map doesn't show"
**Solution:**
```bash
# Install maps properly
npm install react-native-maps
npx expo install expo-location
```

### Problem: "Build fails"
**Solutions:**
1. Check app.json configuration
2. Make sure all packages are compatible
3. Use EAS Build instead of legacy build

### Problem: "Dashboard looks broken"  
**Solution:**
```bash
# Make sure CSS file is imported
# Check browser developer tools for errors
# Verify all images/icons load properly
```

---

## 🎉 Success Metrics

**Demo is successful when:**
- ✅ All 3 apps launch without crashes
- ✅ Core features work (login, tracking, attendance)
- ✅ Visual design impresses stakeholders  
- ✅ Performance is smooth (no lag/freezing)
- ✅ Emergency features demonstrate safety focus
- ✅ Questions are answered confidently

**Business Impact:**
- School administration can monitor entire fleet
- Parents have peace of mind with real-time tracking
- Bus attendants efficiently manage student safety
- Automated notifications reduce manual work
- Emergency protocols ensure quick response times

**Next Steps After Demo:**
1. Gather stakeholder feedback
2. Define production requirements  
3. Plan backend infrastructure
4. Set development timeline
5. Prepare deployment strategy

---

## 📞 Need Help?

**Common Resources:**
- Expo Documentation: [docs.expo.dev](https://docs.expo.dev)
- React Navigation: [reactnavigation.org](https://reactnavigation.org)
- React Native Maps: [github.com/react-native-maps/react-native-maps](https://github.com/react-native-maps/react-native-maps)

**Development Community:**
- Stack Overflow: Search "expo react native [your error]"
- Expo Forums: [forums.expo.dev](https://forums.expo.dev)
- React Native Discord: [discord.gg/reactnative](https://discord.gg/reactnative)

**Emergency Demo Support:**
If something breaks during demo:
1. Stay calm and acknowledge the issue
2. Switch to backup screenshots/recordings
3. Explain what the feature would normally do
4. Continue with working parts of demo
5. Address technical issues in Q&A

Remember: **A successful demo shows the vision and value, not perfect code!**