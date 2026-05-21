import SearchScreen from './SearchScreen';
import TrainCityScreen from './TrainCityScreen';
import TrainListScreen from './TrainListScreen';
import TrainFilterScreen from './TrainFilterScreen';
import TrainTicketDetailScreen from './TrainTicketDetailScreen';
import TrainStopStationScreen from './TrainStopStationScreen';
import TrainRuleScreen from './TrainRuleScreen';
import TrainCreateOrderScreen from './TrainCreateOrderScreen';
import TrainEditPassengerScreen from './TrainEditPassengerScreen';
import TrainOrderSureScreen from './TrainOrderSureScreen';
import TrainOrderListScreen from './TrainOrderListScreen';
import TrainOrderDetailScreen from './TrainOrderDetailScreen';
import TrainRefundScreen from './TrainRefundScreen';
import TrainPaymentScreen from './TrainPaymentScreen';
import TrainReissueScreen from './TrainReissueScreen';
import TrainChangeListScreen from './TrainChangeListScreen';
import TrainChangeSearchScreen from './TrainChangeSearchScreen';
// import TrainChangeTicketScreen from './TrainChangeTicketScreen';
import TrainRelateScreen from './TrainRelateScreen';
// import TrainRelateUnchainScreen from './TrainRelateUnchainScreen';
import TrainNumListScreen from './TrainNumListScreen';
import Train_compCreateOrderScreen from './Train_compCreateOrderScreen';
import Train_compOrderSureScreen from './Train_compOrderSureScreen';
// import TrainComp_EditPassengerScreen from './TrainComp_EditPassengerScreen';
import TrainValidateScreen from './TrainValidateScreen';


let config = {
    
    TrainIndexScreen: {
        screen: SearchScreen
    },
    TrainChangeIndex:{
        screen:TrainChangeSearchScreen
    },
    TrainCityScreen: {
        screen: TrainCityScreen
    },
    TrainListScreen: {
        screen: TrainListScreen
    },
    TrainChangeList:{
        screen:TrainChangeListScreen
    },
    TrainFilterScreen: {
        screen: TrainFilterScreen
    },
    TrainTicketScreen: {
        screen: TrainTicketDetailScreen
    },
    // TrainChangeTicket:{
    //     screen: TrainChangeTicketScreen
    // },
    TrainStopStation: {
        screen: TrainStopStationScreen
    },
    RcReason: {
        screen: TrainRuleScreen
    },
    TrainCreateOrder: {
        screen: TrainCreateOrderScreen
    },
    TrainEditPassenger: {
        screen: TrainEditPassengerScreen
    },
    TrainOrderSure: {
        screen: TrainOrderSureScreen
    },
    TrainOrderListScreen: {
        screen: TrainOrderListScreen
    },
    TrainOrderDetailScreen: {
        screen: TrainOrderDetailScreen
    },
    TrainOrderRefundScreen: {
        screen: TrainRefundScreen
    },
    TrainPayment: {
        screen: TrainPaymentScreen
    },
    TrainOrderReissueScreen: {
        screen: TrainReissueScreen
    },
    TrainRelateScreen: {
        screen: TrainRelateScreen
    },
    // TrainRelateUnchainScreen: {
    //     screen: TrainRelateUnchainScreen
    // },
    TrainNumListScreen: {
        screen: TrainNumListScreen
    },
    Train_compCreateOrderScreen: {
        screen: Train_compCreateOrderScreen
    },
    Train_compOrderSureScreen: {
        screen: Train_compOrderSureScreen
    },
    // TrainComp_EditPassengerScreen: {
    //     screen: TrainComp_EditPassengerScreen
    // },
    TrainValidateScreen: {
        screen: TrainValidateScreen
    }
    
}

for (const key in config) {
    if (config.hasOwnProperty(key)) {
        const element = config[key];
        element.navigationOptions = {
            header: null
        }
    }
}
export default config;
