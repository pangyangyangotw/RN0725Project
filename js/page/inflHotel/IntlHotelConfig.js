import IntlHotelCityScreen from './IntlHotelCityScreen';
import InterHotelOrderSureScreen from './InterHotelOrderSureScreen';
import IntelHotelCreateOrderScreen from './IntelHotelCreateOrderScreen';
// import InterHotelGuaranteeScreen from './InterHotelGuaranteeScreen';
import InterHotelRoomListScreen from './InterHotelRoomListScreen';
import InterHotelListScreen from './InterHotelListScreen';
import InterHotelEditPassengerScreen from './InterHotelEditPassengerScreen';
// import InterHotelPaymentScreen from './InterHotelPaymentScreen';
import InterHotelOrderListScreen from './InterHotelOrderListScreen';
import InterHotelOrderDetailScreen from './InterHotelOrderDetailScreen';
import IntelHotel_comp_CreateOrderScreen from './IntelHotel_comp_CreateOrderScreen';
import IntelHotelRuleScreen from './IntelHotelRuleScreen';
import InterHotel_compEditScreen from './InterHotel_compEditScreen'

let config = {
    IntlHotelCity: {
        screen: IntlHotelCityScreen
    },
    IntlHotelList: {
        screen: InterHotelListScreen
    },
    InterlHotelRoomList:{
        screen: InterHotelRoomListScreen
    },
    InterHotelOrder: {
        screen: IntelHotelCreateOrderScreen
    },
    InterHotelOrderSure:{
        screen: InterHotelOrderSureScreen
    },
    // InterHotelGuarantee: {
    //     screen: InterHotelGuaranteeScreen
    // },
    InterHotelEditPassengerScreen: {
        screen: InterHotelEditPassengerScreen
    },
    // InterHotelPayment: {
    //     screen: InterHotelPaymentScreen
    // },
    InterHotelOrderListScreen: {
        screen: InterHotelOrderListScreen
    },
    InterHotelOrderDetail: {
        screen: InterHotelOrderDetailScreen
    },
    IntlHotel_compCreateOrderScreen: {
        screen: IntelHotel_comp_CreateOrderScreen
    },
    IntelHotelRuleScreen:{
        screen: IntelHotelRuleScreen
    },
    InterHotel_compEditScreen:{
        screen: InterHotel_compEditScreen
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