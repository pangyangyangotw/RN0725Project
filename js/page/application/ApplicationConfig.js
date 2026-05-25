
import ApplicationSelectScreen from './ApplicationSelectScreen';
import ApplicationSelectScreen2 from './ApplicationSelectScreen2';
import ApplicationListScreen from './ApplicationListScreen';
import ApplicationOrderDetailScreen from './ApplicationOrderDetailScreen';
import ApplicationCreateOrderScreen from './ApplicationCreateOrderScreen';
import ApplicationCategoryScreen from './ApplicationCategoryScreen';
// import ApplicationCityScreen from './ApplicationCityScreen';
import ApplicationListMoreScreen from './ApplicationListMoreScreen';
import ApplicationMoreCityScreen from './ApplicationMoreCityScreen';
import ApplicationChooseTraveler from './ApplicationChooseTraveler';
import ApplicationChangeOrderScreen from './ApplicationChangeOrderScreen';

const applicationConfig = {
    ApplicationSelect: {
        screen: ApplicationSelectScreen
    },
    ApplicationSelect2: {
        screen: ApplicationSelectScreen2
    },
    ApplicationListScreen: {
        screen: ApplicationListScreen
    },
    ApplicationOrderDetail: {
        screen: ApplicationOrderDetailScreen
    },
    ApplicationCreateOrder: {
        screen: ApplicationCreateOrderScreen
    },
    ApplicationChangeOrderScreen:{
        screen: ApplicationChangeOrderScreen
    },
    ApplicationCategory: {
        screen: ApplicationCategoryScreen
    },
    // ApplicationCity:{
    //     screen:ApplicationCityScreen
    // },
    ApplicationMoreCity:{
        screen:ApplicationMoreCityScreen
    },
    ApplicationListMore: {
        screen: ApplicationListMoreScreen
    },
    ApplicationChooseTraveler: {
        screen: ApplicationChooseTraveler
    }
}



for (const key in applicationConfig) {
    if (applicationConfig.hasOwnProperty(key)) {
        const element = applicationConfig[key];
        element.navigationOptions = {
            header: null
        }
    }
}

export default applicationConfig;