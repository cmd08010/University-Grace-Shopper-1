import React, { useState, useEffect } from 'react';
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Link,
  useParams,
} from 'react-router-dom';
import qs from 'qs';
import axios from 'axios';
import Login from './Login';
import Orders from './Orders';
import Cart from './Cart';
import Products from './Products';
import Account from './components/Account';
import Mycart from './components/Mycart';
import ProductDetail from './components/ProductDetail';
import SaveForLater from './components/SaveForLater';
import Checkout from './components/Checkout';
import CreateUser from './components/CreateUser';
import Profile from './components/Profile';
import Password from './components/Password';
import Admin from './components/Admin';
import UserManagement from './components/UserManagement';
import PromoManagement from './components/PromoManagement';
import ProductManagement from './components/ProductManagement';
import FeaturedProduct from './components/FeaturedProduct';
import Addresses from './components/Addresses';

const headers = () => {
  const token = window.localStorage.getItem('token');
  return {
    headers: {
      authorization: token,
    },
  };
};

const App = () => {
  const [auth, setAuth] = useState({});
  const [orders, setOrders] = useState([]);
  const [cart, setCart] = useState({});
  const [saveForLater, setSaveForLater] = useState({});
  const [products, setProducts] = useState([]);
  const [productDetail, setProductDetail] = useState({});
  const [lineItems, setLineItems] = useState([]);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [message, setMessage] = useState('');
  const [managedUsers, setManagedUsers] = useState([]);
  const [returnedManagedUser, setReturnedManagedUser] = useState({});
  const [order, setOrder] = useState([]);
  const [promos, setPromos] = useState([]);
  const [err, setErr] = useState('');
  const [cartTotal, setCartTotal] = useState(0);

  // const [checkoutOrder, setCheckoutOrder] = useState()

  //not sure if I need it
  //const [userAccount, setUserAccount] = useState({});
  //console.log(orders, 'orders', cart, 'cart', lineItems, 'lineItems');
  //let cartTotal = 0;

  useEffect(() => {
    console.log('useEffect works');
    axios.get('/api/products').then(response => setProducts(response.data));
    axios.get('/api/promos').then(response => {
      console.log('in use', response.data);
      //debugger;
      setPromos(response.data);
    });
  }, []);

  useEffect(() => {
    if (auth.role === 'ADMIN') {
      axios.get('/api/users', headers()).then(response => {
        console.log(response.data, 'wow', promos);
        setManagedUsers(response.data);
      });
      // axios.get('api/promos').then(response => setPromos(response.data));
    }
  }, [auth, returnedManagedUser]);

  useEffect(() => {
    if (auth.id) {
      const token = window.localStorage.getItem('token');
      axios.get('/api/getLineItems', headers()).then(response => {
        setLineItems(response.data);
      });
    }
  }, [auth]);

  useEffect(() => {
    if (auth.id) {
      axios.get('/api/getCart', headers()).then(response => {
        setCart(response.data);
      });
    }
  }, [auth]);

  useEffect(() => {
    if (auth.id) {
      axios.get('/api/getSaveForLater', headers()).then(response => {
        setSaveForLater(response.data);
      });
    }
  }, [auth]);

  useEffect(() => {
    if (auth.id) {
      axios.get('/api/getOrders', headers()).then(response => {
        setOrders(response.data);
      });
    }
  }, [auth]);

  const login = async credentials => {
    const token = (await axios.post('/api/auth', credentials)).data.token;
    //console.log(credentials);
    //console.log('token', token);
    window.localStorage.setItem('token', token);
    exchangeTokenForAuth().catch(e => {
      //console.log(e.response.data.message, 'inside');
      setErr(e.response.data.message);
    });
  };

  const exchangeTokenForAuth = async () => {
    const response = await axios.get('/api/auth', headers());
    //console.log('exch', response.data);
    setAuth(response.data);
  };

  const validatePassword = async credentials => {
    console.log(credentials.currentPassword, auth.username, 'valPass');
    const creds = {
      username: auth.username,
      password: credentials.currentPassword,
    };
    const tokenToValidate = (await axios.post('/api/auth/validate', creds)).data
      .token;
    const token = window.localStorage.getItem('token');
    //console.log(credentials);

    if (tokenToValidate === token) {
      console.log('if token');
      changePassword(credentials.newPassword);
    }
  };

  const logout = () => {
    window.location.hash = '#';
    window.localStorage.removeItem('token');
    setAuth({});

    // console.log('logout', auth);
  };

  const findCartTotal = () => {
    let cartTotalAmount = 0;
    lineItems
      .filter(lineItem => lineItem.orderId === cart.id)
      .forEach(lineItem => {
        const product = products.find(
          product => product.id === lineItem.productId
        );
        cartTotalAmount += Number(product.price * lineItem.quantity);
        console.log(cartTotal, 'in find');
      });
    setCartTotal(cartTotalAmount);
  };

  useEffect(() => {
    //console.log('when this hits?');
    exchangeTokenForAuth();
    //findCartTotal();
  }, []);

  useEffect(() => {
    //console.log('when this hits?');

    findCartTotal();
  }, [cart, lineItems, auth]);

  // useEffect(() => {
  //   //console.log('when this hits?');
  //   setMessage('');
  // }, []);

  const createOrder = () => {
    const token = window.localStorage.getItem('token');
    axios
      .post('/api/createOrder', null, headers())
      .then(response => {
        setOrders([response.data, ...orders]);
        window.localStorage.setItem('storedOrder', response.data);
        const token = window.localStorage.getItem('token');
        return axios.get('/api/getCart', headers());
      })
      .then(response => {
        setCart(response.data);
      });
  };

  const getProductDetail = productId => {
    axios.get(`/api/products/${productId}`).then(response => {
      setProductDetail(response.data);
    });
  };

  const addToCart = (productId, quantity) => {
    axios
      .post('/api/addToCart', { productId, quantity }, headers())
      .then(response => {
        const lineItem = response.data;
        const found = lineItems.find(_lineItem => _lineItem.id === lineItem.id);
        if (!found) {
          setLineItems([...lineItems, lineItem]);
        } else {
          const updated = lineItems.map(_lineItem =>
            _lineItem.id === lineItem.id ? lineItem : _lineItem
          );
          setLineItems(updated);
        }
        //findCartTotal();
      });
  };

  const changeQtyInCart = (productId, quantity) => {
    axios
      .post('/api/changeQtyInCart', { productId, quantity }, headers())
      .then(response => {
        const lineItem = response.data;
        const found = lineItems.find(_lineItem => _lineItem.id === lineItem.id);
        if (!found) {
          setLineItems([...lineItems, lineItem]);
        } else {
          const updated = lineItems.map(_lineItem =>
            _lineItem.id === lineItem.id ? lineItem : _lineItem
          );
          setLineItems(updated);
        }
        //findCartTotal();
      });
  };

  // updating cart total amount to use later
  const updateCartTotal = (id, total) => {
    console.log((id, total, 'this is cart.id-->', cart.id));
    axios
      .put(`/api/cart/total/${cartTotal.id}`, { id, total })
      .then(response => {
        console.log(response.data, 'update cart total response');
      });
  };

  const addBackToCart = (productId, quantity) => {
    axios
      .post('/api/addBackToCart', { productId, quantity }, headers())
      .then(response => {
        axios.get('/api/getLineItems', headers()).then(response => {
          setLineItems(response.data);
          //findCartTotal();
        });
      });
  };

  const addToSaveForLater = productId => {
    axios
      .post('/api/addToSaveForLater', { productId }, headers())
      .then(response => {
        // debugger;
        const lineItem = response.data;

        const found = lineItems.find(
          _lineItem =>
            _lineItem.productId === lineItem.productId &&
            _lineItem.orderId === cart.id
        );

        //console.log(found, 'found', lineItem, 'lineitem');
        // if (!found) {
        //   setLineItems([...lineItems, lineItem]);
        // } else {

        // const updated = lineItems.map(_lineItem => {
        //   //console.log(_lineItem);
        //   return _lineItem.id === lineItem.id ? lineItem : _lineItem;
        // });
        // const test = updated.filter(li => li.id !== found.id);
        // console.log(found, 'wow', test);
        // console.log(updated, 'updated');
        // setLineItems(test);
        //setLineItems(lineItems.filter(_lineItem => _lineItem.id !== found.id));
        //}
        axios.get('/api/getLineItems', headers()).then(response => {
          setLineItems(response.data);
        });
      });
  };

  const removeFromCart = lineItemId => {
    axios.delete(`/api/removeFromCart/${lineItemId}`, headers()).then(() => {
      setLineItems(lineItems.filter(_lineItem => _lineItem.id !== lineItemId));
    });
  };

  const removeFromSave = lineItemId => {
    axios.delete(`/api/removeFromSave/${lineItemId}`, headers()).then(() => {
      setLineItems(lineItems.filter(_lineItem => _lineItem.id !== lineItemId));
    });
  };

  //creating user account
  const createUser = user => {
    //console.log(user, 'first in');
    axios.post('/api/user', user).then(response => {
      login({ username: user.username, password: user.password });
      //setUserAccount(response.data);
    });
  };

  const updateUser = user => {
    console.log(user);
    axios.put(`/api/user/${user.id}`, user).then(response => {
      console.log(response.data.username, 'update response');
      exchangeTokenForAuth();
      // login({
      //   username: response.data.username,
      //   password: user.password,
      // });
    });
  };

  const manageUser = isBlockedUser => {
    console.log(isBlockedUser, 'put is blocked');
    axios
      .put(`/api/manage/user/${isBlockedUser.id}`, isBlockedUser)
      .then(response => {
        const responseUser = response.data;
        setReturnedManagedUser({
          id: responseUser.id,
          isBlocked: responseUser.isBlocked,
        });
        console.log(response.data, 'isblocked response');
      });
  };

  //console.log(auth, 'to check if it reset after updateUser');

  const changePassword = password => {
    const userPassword = { id: auth.id, password };
    console.log(userPassword);
    axios.put(`/api/user/password/${auth.id}`, userPassword).then(response => {
      setMessage('You have changed your password successfully');
    });
  };

  ////create, update remove promo
  const createPromo = madePromo => {
    axios.post('/api/promos', madePromo).then(response => {
      const returnedPromo = response.data;
      // console.log(returnedPromo, 'returned');

      setPromos([...promos, returnedPromo]);
    });
  };

  const updatePromo = revisedPromo => {
    console.log(revisedPromo);
    axios.put(`/api/promos/${revisedPromo.id}`, revisedPromo).then(response => {
      console.log(response.data, 'returned revised promo');
      const returnedPromo = response.data;
      const updated = promos.map(_promo =>
        _promo.id === returnedPromo.id ? returnedPromo : _promo
      );
      setPromos(updated);
    });
  };

  console.log('outside in app cart', cart);

  ///return
  const userCart = lineItems.filter(lineItem => lineItem.orderId === cart.id);

  let totalQty = 0;
  const count = userCart.forEach(item => {
    totalQty += item.quantity;
  });

  if (!auth.id) {
    return (
      <Router>
        <div>
          <nav className="header-container">
            <Link to="/">
              <h1 className="header-name">Grace Shopper</h1>
            </Link>
            <ul className="nav-bar">
              <li>
                <Link to="/products">Shop</Link>
              </li>
              <li>
                <Link to="/login">Login</Link>
              </li>
              <li>
                <Link to="/orders">Orders</Link>
              </li>
              <li>
                <Link to="/cart">
                  <i className="fas fa-shopping-bag"></i>
                  <span>{totalQty}</span>
                </Link>
                <Link to="/checkout"></Link>
              </li>
            </ul>
          </nav>
        </div>
        <Switch>
          <Route path="/" exact>
            <div className="horizontal">
              <FeaturedProduct
                products={products}
                getProductDetail={getProductDetail}
                productDetail={productDetail}
              />
            </div>
          </Route>
          <Route path="/login">
            <Login login={login} err={err} />
          </Route>
          <Route path="/products">
            <Products
              addToCart={addToCart}
              products={products}
              getProductDetail={getProductDetail}
              productDetail={productDetail}
            />
          </Route>
          <Route path="/register">
            <CreateUser login={login} createUser={createUser} />
          </Route>
          <Route path="/cart">
            <Mycart
              lineItems={lineItems}
              removeFromCart={removeFromCart}
              cart={cart}
              createOrder={createOrder}
              orders={orders}
              products={products}
              addToCart={addToCart}
              saveForLater={saveForLater}
              addToSaveForLater={addToSaveForLater}
              removeFromSave={removeFromSave}
              changeQtyInCart={changeQtyInCart}
              addBackToCart={addBackToCart}
              getProductDetail={getProductDetail}
              //cartTotal={cartTotal}
            />
          </Route>
        </Switch>
      </Router>
    );
  } else {
    return (
      <Router>
        <div>
          <nav className="header-container">
            <Link to="/">
              <div>
                <h1 className="header-name">Grace Shopper</h1>
              </div>
            </Link>
            <ul className="nav-bar">
              <li>
                <Link to="/products">Shop</Link>
              </li>
              <li>
                <Link to="/account">Account</Link>
              </li>
              <li>
                <Link to="/orders">Orders</Link>
              </li>
              <li>
                <Link to="/cart">
                  <i className="fas fa-shopping-bag"></i>
                  <span>{totalQty}</span>
                </Link>
              </li>
            </ul>
            <button onClick={logout}>
              Logout {auth.firstname} {auth.lastname}
            </button>
          </nav>
          <Link to="/products"></Link>
        </div>
        <Switch>
          <Route path="/" exact>
            <div className="horizontal">
              <FeaturedProduct
                products={products}
                getProductDetail={getProductDetail}
                productDetail={productDetail}
              />
              {/* <Products
                addToCart={addToCart}
                products={products}
                getProductDetail={getProductDetail}
              /> */}
            </div>
          </Route>
          <Route path="/login">
            <Login login={login} err={err} />
          </Route>
          <Route path="/register">
            <CreateUser login={login} />
          </Route>
          <Route path="/profile">
            <Profile
              auth={auth}
              updateUser={updateUser}
              setMessage={setMessage}
            />
          </Route>
          <Route path="/admin">
            <Admin
              auth={auth}
              updateUser={updateUser}
              setMessage={setMessage}
            />
          </Route>
          <Route path="/user/management">
            <UserManagement
              auth={auth}
              updateUser={updateUser}
              setMessage={setMessage}
              managedUsers={managedUsers}
              manageUser={manageUser}
              returnedManagedUser={returnedManagedUser}
              // setIsBlockedUser={setIsBlockedUser}
            />
          </Route>
          <Route path="/promo/management">
            <PromoManagement
              auth={auth}
              updateUser={updateUser}
              setMessage={setMessage}
              promos={promos}
              managedUsers={managedUsers}
              createPromo={createPromo}
              updatePromo={updatePromo}
            />
          </Route>
          <Route path="/product/management">
            <ProductManagement
              auth={auth}
              updateUser={updateUser}
              setMessage={setMessage}
            />
          </Route>
          <Route path="/password">
            <Password
              auth={auth}
              validatePassword={validatePassword}
              message={message}
              setMessage={setMessage}
            />
          </Route>
          <Route path="/products">
            <Products
              addToCart={addToCart}
              products={products}
              getProductDetail={getProductDetail}
            />
          </Route>
          <Route path="/account">
            <Account auth={auth} logout={logout} />
          </Route>
          <Route path="/cart">
            <Mycart
              lineItems={lineItems}
              removeFromCart={removeFromCart}
              cart={cart}
              createOrder={createOrder}
              products={products}
              addToCart={addToCart}
              saveForLater={saveForLater}
              addToSaveForLater={addToSaveForLater}
              changeQtyInCart={changeQtyInCart}
              productDetail={productDetail}
              getProductDetail={getProductDetail}
              removeFromSave={removeFromSave}
              addBackToCart={addBackToCart}
              auth={auth}
              cartTotal={cartTotal}
              findCartTotal={findCartTotal}
              updateCartTotal={updateCartTotal}
            />
          </Route>
          <Route path="/orders">
            <Orders
              cartItems={lineItems}
              products={products}
              orders={orders}
              cart={cart}
              order={order}
              setOrder={setOrder}
            />
          </Route>
          <Route path="/checkout">
            <Checkout
              cartItems={lineItems}
              products={products}
              setOrders={setOrders}
              orders={orders}
              auth={auth}
              cart={cart}
              order={order}
              cartTotal={cartTotal}
              updateCartTotal={updateCartTotal}
              promos={promos}
            />
          </Route>
          <Route path="/checkout/:id">
            <Checkout
              cartItems={lineItems}
              products={products}
              setOrders={setOrders}
              orders={orders}
              auth={auth}
              cart={cart}
            />
          </Route>
          <Route path="/productDetails">
            <ProductDetail
              cartItems={lineItems}
              products={products}
              orders={orders}
              productDetail={productDetail}
              addToCart={addToCart}
              changeQtyInCart={changeQtyInCart}
            />
          </Route>
          <Route path="/checkout/completed">
            <span>HI</span>
          </Route>
          <Route path="/addresses">
            <Addresses auth={auth} />
          </Route>
        </Switch>
      </Router>
    );
  }
};

export default App;
