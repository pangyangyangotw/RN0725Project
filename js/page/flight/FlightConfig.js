// import FlightScreen from './FlightScreen';

// const FlightConfig = {
//   Flight: {
//     screen: FlightScreen,
//     navigationOptions: {
//       header: null, // Customize header if needed
//       title: 'Flight'
//     }
//   }
// };

// export default FlightConfig;

import SearchScreen from './SearchScreen';
import FlightCityScreen from './FlightCityScreen';
import FlightListScreen from './FlightListScreen';
import FlightFilterScreen from './FlightFilterScreen';
import FlightRuleScreen from './FlightRuleScreen';
import FlightCreatOrderScreen from './FlightCreatOrderScreen';
import FlightRtListScreen from './FlightRtListScreen';
import FlightRtRuleScreen from './FlightRtRuleScreen';
import FlightEditPassengerScreen from './FlightEditPassengerScreen';
import FlightOrderSureScreen from './FlightOrderSureScreen';
import FlightOrderListScreen from './FlightOrderListScreen';
import FlightOrderDetailScreen from './FlightOrderDetailScreen';
import FlightOrderRefunScreen from './FlightOrderRefunScreen';
import FlightChangeSearchScreen from './FlightChangeSearchScreen';
import FlightChangeScreen from './FlightChangeScreen';
import FlightPaymentScreen from './FlightPaymentScreen';
import FlightMorePriceScreen from './FlightMorePriceScreen';
import FlightRtMorePriceScreen from './FlightRtMorePriceScreen';
// import FlightChangeMoreScreen from './FlightChangeMoreScreen';
import FlightChangeListScreen from './FlightChangeListScreen';
import Flight_compCreatOrderScreen from './Flight_compCreatOrderScreen';
import Flight_compEditPassengerScreen from './Flight_compEditPassengerScreen';
import InvoiceListScreen from './InvoiceListScreen';
import FlightTrainListScreen from './FlightTrainListScreen';
const flightConfig = {
    FlightSearchIndex: {
        screen: SearchScreen
    },
    FlightCityIndex: {
        screen: FlightCityScreen
    },
    FlightScreenIndex: {
        screen: FlightListScreen
    },
    FLightChangeList: {
        screen: FlightChangeListScreen
    },
    // FlightChangeMore: {
    //     screen: FlightChangeMoreScreen
    // },
    FlightRtList: {
        screen: FlightRtListScreen
    },

    FloghtCotidionScreen: {
        screen: FlightFilterScreen
    },
    FlightRuleScreen: {
        screen: FlightRuleScreen
    },
    FlightRtRule: {
        screen: FlightRtRuleScreen
    },
    FlightOrderScreeb: {
        screen: FlightCreatOrderScreen
    },
    FlightEditPassenger: {
        screen: FlightEditPassengerScreen
    },
    FlightOrderSure: {
        screen: FlightOrderSureScreen
    },
    FlightOrderList: {
        screen: FlightOrderListScreen
    },
    FlightOrderDetail: {
        screen: FlightOrderDetailScreen
    },
    FlightOrderRefund: {
        screen: FlightOrderRefunScreen
    },
    FlightChangeSearch: {
        screen: FlightChangeSearchScreen
    },
    FlightChangeDetail: {
        screen: FlightChangeScreen
    },
    FlightPayment: {
        screen: FlightPaymentScreen
    },
    FlightMorePrice: {
        screen: FlightMorePriceScreen
    },
    FlightRtMorePrice: {
        screen: FlightRtMorePriceScreen
    },
    Flight_compCreatOrderScreen: {
        screen: Flight_compCreatOrderScreen
    },
    FlightCompEditPassengerScreen: {
        screen: Flight_compEditPassengerScreen
    },
    InvoiceListScreen: {
        screen: InvoiceListScreen
    },
    FlightTrainListScreen: {
        screen: FlightTrainListScreen
    },
}

for (const key in flightConfig) {
    if (flightConfig.hasOwnProperty(key)) {
        const element = flightConfig[key];
        element.navigationOptions = {
            header: null
        }
    }
}

export default flightConfig;
