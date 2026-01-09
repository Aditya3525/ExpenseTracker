import { StatusBar } from "expo-status-bar";
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Platform,
  KeyboardAvoidingView,
  Image,
  Alert
} from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect } from "react";
import { auth } from "./firebaseConfig";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from 'firebase/auth';
import { db } from './firebaseConfig';
import { collection, addDoc, getDocs, deleteDoc, doc, query, where } from "firebase/firestore";

export default function App() {

  // --- Auth + UI state ---
  const [user, setUser] = useState(null);
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(true);

  // --- Expense form + list state ---
  const [expenses, setExpenses] = useState([]);
  const [expenseTitle, setExpenseTitle] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');

  const [isSplash, setIsSplash] = useState(true);

  // Format helper keeps currency consistent across UI
  const formatCurrency = (amount) => `₹ ${Number(amount || 0).toFixed(2)}`;

  // Firebase data helpers
  const loadExpensesFromFirebase = async () => {
    if (!user) return;
    try {
      const expensesQuery = query(collection(db, 'expenses'), where('userId', '==', user.uid));
      const querySnapshot = await getDocs(expensesQuery);
      const loadedExpenses = [];
      querySnapshot.forEach((doc) => {
        loadedExpenses.push({
          id: doc.id,
          value: doc.data().value,
          price: doc.data().price
        });
      });
      setExpenses(loadedExpenses);
    } catch (error) {
      console.log('Failed to load expenses:', error);
    }
  };



  // 1. Monitor Auth State
  useEffect(() => {
    // Keep `user` in sync with Firebase auth changes
    const unsubscriber = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);

      setTimeout(() => {
        setIsSplash(false);
        setLoading(false);
      }, 3000);
    });
    return unsubscriber;
  }, []);

  // 2. Load Expenses (from Firebase)
  useEffect(() => {
    // Restore expenses for the current user
    if (user) {
      loadExpensesFromFirebase();
    } else {
      setExpenses([]);
    }
  }, [user]);

  // 3. Handle Login / Signup
  const handleAuthentication = async () => {
    try {
      if (user) {
        // If already logged in, this acts as logout
        await signOut(auth);
      } else {
        if (isLogin) {
          // Existing user login
          await signInWithEmailAndPassword(auth, email, password);
          setEmail('');
          setPassword('');
        } else {
          // New user signup
          await createUserWithEmailAndPassword(auth, email, password);
          setEmail('');
          setPassword('');
        }
      }
    } catch (error) {
      alert(error.message);
    }
  };

  // --- RENDERING ---

  // A. Loading Screen
  if (isSplash || loading) {
    return (
      <View style={styles.splashContainer}>
        <Image
          source={require('./assets/Logo copy.png')}
          style={styles.splashImage}
        />

      </View>
    );
  }

  // B. Login / Signup Screen
  if (!user) {
    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <View style={styles.authContainer}>
          <Text style={styles.headerText}>{isLogin ? 'Welcome Back!' : 'Create Account'}</Text>

          <TextInput
            style={styles.input}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          {/* ADDED: The missing Login Button */}
          <TouchableOpacity style={styles.button} onPress={handleAuthentication}>
            <Text style={styles.buttonText}>{isLogin ? 'LOGIN' : 'SIGN UP'}</Text>
          </TouchableOpacity>

          {/* ADDED: The missing Toggle Switch */}
          <TouchableOpacity onPress={() => setIsLogin(!isLogin)}>
            <Text style={styles.switchText}>
              {isLogin ? "New here? Create an account" : "Already have an account? Login"}
            </Text>
          </TouchableOpacity>

        </View>
      </KeyboardAvoidingView>
    );
  }

  // C. Main App Screen (Only shows if logged in)

  const handleAddExpense = async () => {
    // Validate both fields are filled
    if (expenseTitle.trim().length === 0) {
      alert('Please enter expense title');
      return;
    }
    const amount = Number(expenseAmount);
    if (isNaN(amount) || amount < 0) {
      alert('Please enter a valid amount.');
      return;
    }
    try {
      const docRef = await addDoc(collection(db, 'expenses'), {
        value: expenseTitle,
        price: Number(expenseAmount),
        userId: user.uid
      });
      // Create new expense item
      const newExpense = {
        id: docRef.id,
        value: expenseTitle,
        price: Number(expenseAmount)
      };
      // Update state and persist
      setExpenses([...expenses, newExpense]);
      setExpenseTitle('');
      setExpenseAmount('');
    } catch (error) {
      alert('Error adding expense: ' + error.message);
    }
  };

  const handleRemoveExpense = async (expenseId) => {
    // Delete expense from Firebase and update local state
    try {
      await deleteDoc(doc(db, 'expenses', expenseId));
      const updatedExpenses = expenses.filter((item) => item.id !== expenseId);
      setExpenses(updatedExpenses);
    } catch (error) {
      alert('Error deleting expense: ' + error.message);
    }
  }
  const totalExpense = expenses.reduce((sum, item) => {
    return sum + item.price;
  }, 0);

  const confirmDelete = (id) => {
    Alert.alert(
      "Delete Expense",
      "Are you sure you want to delete this expense?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: () => handleRemoveExpense(id) }
      ]
    );
  };
  const isDisabled = expenseTitle.trim().length === 0 || expenseAmount.trim().length === 0;
  return (

    <SafeAreaView style={styles.container}>

      <View style={styles.header}>
        <Text style={styles.headerText}>My Budget</Text>
        {/* ADDED: Logout Button */}
        <TouchableOpacity onPress={handleAuthentication}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.totalContainer}>
        <Text style={styles.totalLabel}>Total Spent</Text>
        <Text style={styles.totalAmount}>{formatCurrency(totalExpense)}</Text>
      </View>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="What did you buy?"
          value={expenseTitle}
          onChangeText={(text) => setExpenseTitle(text)}
        />
        <TextInput
          style={styles.input}
          placeholder="Amount (₹)"
          keyboardType="numeric"
          value={expenseAmount}
          onChangeText={setExpenseAmount}
        />

        <TouchableOpacity
          style={styles.button}
          activeOpacity={0.8}
          onPress={handleAddExpense}
          disabled={isDisabled}
        >
          <Text style={styles.buttonText}>ADD EXPENSE</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.listContainer}>
        <Text style={styles.listTitle}>History</Text>
        {expenses.length === 0 ? (
          <Text style={{ textAlign: 'center', marginTop: 40, color: '#666' }}>
            No expenses yet. Start adding!
          </Text>
        ) : (
          <FlatList
            data={expenses}
            keyExtractor={(item) => item.id}
            renderItem={({ item: expenseItem }) => (
              <TouchableOpacity
                onLongPress={() => confirmDelete(expenseItem.id)}
                activeOpacity={0.6}
              >
                <View style={styles.itemCard}>
                  <Text style={styles.itemText}>{expenseItem.value}</Text>
                  <Text style={styles.itemPrice}>{formatCurrency(expenseItem.price)}</Text>
                </View>
              </TouchableOpacity>
            )}
          />
        )}
      </View>

      <StatusBar style="auto" />
    </SafeAreaView>
  );
}

// CHANGED: Renamed 'style' to 'styles' to match the code above
const styles = StyleSheet.create({
  totalContainer: {
    backgroundColor: '#fff',
    margin: 20,
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    elevation: 4,
  },

  totalLabel: {
    fontSize: 16,
    color: '#666',
  },

  totalAmount: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#6200ea',
    marginTop: 5,
  },

  splashContainer: {
    flex: 1,
    backgroundColor: '#ffffff', // White background to blend with the image
  },
  splashImage: {
    flex: 1,
    width: '100%',
    height: '100%',
    resizeMode: 'contain', // 'contain' keeps the whole logo visible without cutting off text
  },
  container: {
    flex: 1,
    paddingTop: 10,
    backgroundColor: '#f5f5f5',
  },
  authContainer: {
    padding: 20,
    marginTop: 50,
  },
  header: {
    borderBottomColor: '#ddd',
    backgroundColor: '#fff',
    padding: 20,
    flexDirection: 'row', // Align text and logout button
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333'
  },
  logoutText: {
    color: 'red',
    fontWeight: 'bold',
  },
  inputContainer: {
    padding: 20,
    margin: 20,
    backgroundColor: '#fff',
    borderRadius: 10,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25
  },
  listContainer: {
    flex: 1,
    padding: 20
  },
  input: {
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    padding: 10,
    marginBottom: 20,
    fontSize: 16,
    backgroundColor: '#fff', // Added for better visibility
  },
  button: {
    backgroundColor: '#6200ea',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  switchText: {
    marginTop: 20,
    textAlign: 'center',
    color: '#666',
  },
  listTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  itemCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    elevation: 2,
  },
  itemText: {
    fontSize: 16,
    color: '#333',
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#6200ea',
  },
}); 