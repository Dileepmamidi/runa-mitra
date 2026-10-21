package com.runamitra.app;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;
import com.ionicframework.capacitor.Checkout;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        // Razorpay's native checkout (UPI apps, cards, netbanking). This plugin
        // is not auto-registered, so it must be added before super.onCreate.
        registerPlugin(Checkout.class);
        super.onCreate(savedInstanceState);
    }
}
