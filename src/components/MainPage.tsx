import React, { useState, useEffect } from 'react'
import { ExpressCheckoutElement } from '@stripe/react-stripe-js';
import { useStripe } from '@stripe/react-stripe-js';
import { useElements } from '@stripe/react-stripe-js';
import { StripeExpressCheckoutElementConfirmEvent } from '@stripe/stripe-js';

export default function MainPage() {

  
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [text, setText] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const stripe = useStripe();
    const elements = useElements();
    const [paymentRequest, setPaymentRequest] = useState({} || null);
    const [messages, addMessage] = useState("");

  useEffect(() => {
    if (!stripe || !elements) {
      return;
    }

    const pr = stripe.paymentRequest({
      country: 'US',
      currency: 'usd',
      total: {
        label: 'Demo total',
        amount: 1999,
      },
      requestPayerName: true,
      requestPayerEmail: true,
    });

    console.log(pr)

    // Check the availability of the Payment Request API.
    pr.canMakePayment().then(result => {
      console.log(result)
      if (result) {
        setPaymentRequest(pr);
      }
    });
    console.log(paymentRequest)
    pr.on('paymentmethod', async (e) => {
      const response = await fetch("/api/hello", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentMethodType: 'card',
          currency: 'usd',
        }),
      });

      const { error: backendError, clientSecret } = await response.json();


      if (backendError) {
        addMessage(backendError.message);
        return;
      }

      addMessage('Client secret returned');

      const {
        error: stripeError,
        paymentIntent,
      } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: e.paymentMethod.id,
      }, { handleActions: false });

      if (stripeError) {
        // Show error to your customer (e.g., insufficient funds)
        addMessage(stripeError.message || "");
        return;
      }

      // Show a success message to your customer
      // There's a risk of the customer closing the window before callback
      // execution. Set up a webhook or plugin to listen for the
      // payment_intent.succeeded event that handles any business critical
      // post-payment actions.
      addMessage(`Payment ${paymentIntent.status}: ${paymentIntent.id}`);
    });

  }, [stripe, elements, addMessage]);
  console.log(messages)

    const updatingUser = async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
  
      
      const userData = {name, email, text, password }
  
      const response = await fetch("https://b1e9-168-228-235-209.ngrok-free.app/webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({userData })
      })
      const data = await response.json();
      console.log(data);
    }

    const onConfirm = async (event: React.FormEvent<HTMLFormElement>) => {
      console.log(event)
      if (!stripe || !elements) {
        // Stripe.js or Elements haven't loaded yet.
        // Make sure to disable form submission until they have loaded.
        return;
      }

      const { error: submitError } = await elements.submit();
      if (submitError) {
        setErrorMessage(submitError.message || "");
        return;
      }

      // Create the PaymentIntent and obtain clientSecret
      const res = await fetch('/create-intent', {
        method: 'POST',
      });
      const { client_secret: clientSecret } = await res.json();
  
      // Confirm the PaymentIntent using the details collected by the Express Checkout Element
      const {error} = await stripe.confirmPayment({
        // `elements` instance used to create the Express Checkout Element
        elements,
        // `clientSecret` from the created PaymentIntent
        clientSecret,
        confirmParams: {
          return_url: 'https://example.com/order/123/complete',
        },
      });
  
      if (error) {
        // This point is only reached if there's an immediate error when
        // confirming the payment. Show the error to your customer (for example, payment details incomplete)
        setErrorMessage(error.message || "");
      } else {
        // The payment UI automatically closes with a success animation.
        // Your customer is redirected to your `return_url`.
      }
    };

    console.log(errorMessage)
  
  
  
  
    async function webHook (e: React.FormEvent<HTMLFormElement>, data: any) {
      e.preventDefault();
  
      console.log(data)
      const response = await fetch("https://b1e9-168-228-235-209.ngrok-free.app/webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      })
  
      console.log(response)
    }
  
    async function jobAlert(e: React.FormEvent<HTMLButtonElement>) {
      e.preventDefault();
      const userData = {
        name: "John",
        email: "testin@hola.com",
      }
  
      const formElement = document.createElement('form');
      const event = new Event('submit');
      formElement.dispatchEvent(event);
      await webHook(event as unknown as React.FormEvent<HTMLFormElement>, userData);
    }
  
    return (
      <>
        <form className='form_Wrapper' onSubmit={updatingUser}>
          <label htmlFor="name">Name</label>
          <input type="text" id="name" name="name" onChange={e => setName(e.target.value)} />
          <label htmlFor="name">Email</label>
          <input type="email" id="email" name="email" onChange={e => setEmail(e.target.value)}/>
          <br />
          <label htmlFor="email">Password</label>
          <input type="password" id="email" name="password"  onChange={e => setPassword(e.target.value)}/>
          <label htmlFor="name">Text </label>
          <input type="text" id="text" name="text" onChange={e => setText(e.target.value)} />
          <button type="submit">Submit</button>
  
        </form>
        
      <div>

        <h1>Start a new job with a new technician</h1>
        <button onClick={jobAlert}>Start!</button>

      </div>
      <div>
        <h1>Testing Google/Apple Pay</h1>



              <ExpressCheckoutElement onConfirm={onConfirm as unknown as (event: StripeExpressCheckoutElementConfirmEvent) => any} />
       </div>
          </>
      
       
    )
};
