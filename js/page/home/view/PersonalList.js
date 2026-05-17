import React from 'react';
import {
    StyleSheet,
    View,
    Image,
    TouchableHighlight,
} from 'react-native';
import CustomText from '../../../custom/CustomText';
import Theme from '../../../res/styles/Theme';
import Ionicons from 'react-native-vector-icons/Ionicons';
import NavigationUtils from '../../../navigator/NavigationUtils';
// import { withNavigation } from 'react-navigation';
import { useNavigation } from '@react-navigation/native';
import  LinearGradient from 'react-native-linear-gradient';
import UserInfoDao from '../../../service/UserInfoDao';
import CommonService from '../../../service/CommonService';

class PersonalList extends React.Component {
    constructor(props){
        super(props);
        this.state={
            userInfo:{},
            //客户信息
            customerInfo: {},
            listArray : [
                 {
                    key: 'personalInfo',
                    name: '个人信息',
                    img: require('../../../res/Uimage/contacts.png'),
                    cleck:false,
                },
                {
                    key: 'FeedBack',
                    name: '个人信用卡',
                    img: require('../../../res/Uimage/bank_card.png'),
                    cleck:false,
                },
                {
                    key: 'tainLink',
                    name: '登录12306账号',
                    img: require('../../../res/Uimage/train_line.png'),
                    cleck:false,
                }
                // ,{
                //     key: 'chunqiu',
                //     name: '春秋会员注册',
                //     img: require('../../../res/Uimage/flightFloder/_flight.png'),
                //     cleck:false,
                // }
                // ,{
                //     key: 'travelller',
                //     name: '常用乘机人',
                //     img: require('../../../res/Uimage/group_line.png'),
                //     cleck:false,
                // }
                ,{
                    key: 'authorize',
                    name: '预订人授权',
                    img: require('../../../res/Uimage/file_user.png'),
                    cleck:false,
                },
                
            ]
        }
    }

    componentDidMount=()=>{
        let unflightList=[
            {
                key: 'un_user',
                img: require('../../../res/Uimage/unused_tickets.png'),
                name: '未使用机票',
                cleck:false,
            }
        ]
        let handTravelList = [
            {
                key: 'addTraveler',
                name: '出行人授权',
                img: require('../../../res/Uimage/shield_user.png'),
                cleck:false,
            },
            {
                key: 'travelerInfoManage',
                name: '出行人信息列表',
                img: require('../../../res/Uimage/user_settings.png'),
                cleck:false,
            }
        ]
        let invoiceList = [
            {
                key: 'invoice',
                name: 'Invoice',
                img: require('../../../res/Uimage/coupon.png'),
                cleck:false
            }
        ]
        let travelllerList = [
            {
                key: 'travelller',
                name: '常用乘机人',
                img: require('../../../res/Uimage/group_line.png'),
                cleck:false,
            }
        ]
        let authorizedApprove = [
            {
                key: 'authorizedApprove',
                name: '审批授权人',
                img: require('../../../res/Uimage/shield_user.png'),
                cleck:false
            }
        ]
        UserInfoDao.getCustomerInfo().then(customerInfo=>{
            if(customerInfo&&customerInfo.Setting&&customerInfo.Setting.EnableUnusedAirlineTickets){
                this.state.listArray=this.state.listArray.concat(unflightList);
            }
            if(!customerInfo?.Setting?.OrderPageConfig?.HideAuthorizedApprovePerson){
                this.state.listArray=this.state.listArray.concat(authorizedApprove);
            }
            this.setState({
                customerInfo:customerInfo,
            })
        }) 
        UserInfoDao.getUserInfo().then(userInfo=>{
            if((userInfo&&userInfo.Permission&8)==8){//本人有帮他人预订权限时显示
                this.state.listArray=this.state.listArray.concat(handTravelList);
            }
            if((userInfo&&userInfo.Permission&2)==2){
                this.state.listArray=this.state.listArray.concat(travelllerList);
            }
            this.setState({
                userInfo:userInfo,
            })
        }).catch(error => {
            this.toastMsg(error.message || '获取数据异常');
        })
        CommonService.OrderHubInvoiceRight().then(response => {//获取是否展示invoice
            if (response && JSON.parse(response).success) {
                this.state.listArray=invoiceList.concat(this.state.listArray);
                this.setState({});
            } else {
                    this.toastMsg(response.message || 'No Invoice');
            }
        }).catch(error => {
            this.toastMsg(error.message || 'No Invoice');
        })
    }

    _toDetail = (item) => {
        item.cleck = !item.cleck
        const { login12306Name, login12306Data } = this.props;
        const { userInfo } = this.state;
        this.setState({})
        if (item.key === 'invoice') {
            NavigationUtils.push(this.props.navigation, 'DownInvoiceListScreen');
        } else if (item.key === 'aboutUs') {
            NavigationUtils.push(this.props.navigation, 'AboutUs');
        } else if (item.key === 'un_user') {
            NavigationUtils.push(this.props.navigation, 'UnUserOrder');
        } else if (item.key === 'notice') {
            NavigationUtils.push(this.props.navigation, 'NoticeList');
        } else if (item.key === 'travelller') {
            NavigationUtils.push(this.props.navigation, 'TravellerList');
        } else if (item.key === 'personalInfo') {
            NavigationUtils.push(this.props.navigation, 'PersonalInfo');
        } else if (item.key === 'FeedBack') {
            NavigationUtils.push(this.props.navigation, 'CreditCardScreen');
        } else if (item.key === 'tainLink') {
            NavigationUtils.push(this.props.navigation, 'TrainRelateScreen',{ login12306Name,login12306Data,from:true });
        } else if (item.key === 'authorize') {
            NavigationUtils.push(this.props.navigation, 'AddShakeHandsScreen',{userInfo});
        } else if (item.key === 'addTraveler') {
            NavigationUtils.push(this.props.navigation, 'AddTravelerScreen',{userInfo});
        } else if (item.key === 'travelerInfoManage') {
            NavigationUtils.push(this.props.navigation, 'HandersListScreen');
        } else if (item.key === 'authorizedApprove') {
            NavigationUtils.push(this.props.navigation, 'AddApprovalScreen');
        }
        // else if (item.key === 'chunqiu') {
        //     NavigationUtils.push(this.props.navigation, 'ChunqiuLoginScreen');
        // }
    }

    _renderItem = (item, index) => {
        return (
            <TouchableHighlight key={index} onPress={this._toDetail.bind(this, item.key)}
             underlayColor='transparent'>
                <View style={[{ flexDirection: 'row', backgroundColor: 'white', paddingRight: 10 }, index === listArray.length - 1 ? null : curStyle.listBottom,]}>
                    {
                        item.color ? <View style={{ marginHorizontal: 15, marginVertical: 10, width: 25, height: 25, borderRadius: 25, backgroundColor: item.color, justifyContent: 'center', alignItems: 'center' }}>
                            <Image style={{ height: 20, width: 20 }} source={item.img} />
                        </View> : null
                    }
                    {
                        !item.color ? <View style={{ marginLeft: 15, marginRight: 15, paddingTop: 10, paddingBottom: 10 }}>
                            <Image style={[curStyle.listIcon]} source={item.img} />
                        </View> : null
                    }

                    <View style={{ flex: 1, paddingBottom: 10, justifyContent: 'space-between', alignItems: 'center' }}>
                        <CustomText style={{ fontSize: 15, color: 'black' }} text={item.name} />
                        <Ionicons name={'chevron-forward'} size={22} color={'lightgray'} />
                    </View>
                </View>
            </TouchableHighlight>
        )
    }

    render() {
        const{listArray,customerInfo} = this.state
        return (
            // <View style={curStyle.viewStyle}>
            <LinearGradient 
                start={{x: 1, y: 0}} 
                end={{x: 1, y: 1}}
                style={curStyle.viewStyle}
                colors={['#fff','#fff']}                
                >
                {
                    listArray.map((item,index)=>{
                        return (
                            item.key === 'tainLink' && !customerInfo?.Addition?.HasTrainAuth ? null :
                            <TouchableHighlight key={index} underlayColor='transparent'  
                                 onPress={this._toDetail.bind(this, item)}
                                //  onLongPress={()=>{
                                //     item.cleck = !item.cleck
                                //     this.setState({})  
                                //  }}
                                //  onPressOut={this._toDetail.bind(this, item)}
                                 style={{paddingHorizontal:20}}
                                 delayLongPress={300} // 适当延长长按触发时间
                                 shouldCancelWhenOutside={true} // 滑动到组件外时取消
                                 >
                               <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center',borderBottomWidth:1,borderColor:Theme.lineColor,paddingVertical:15,}}>
                                   <View style={{alignItems:'center',flexDirection:'row'}}>
                                        <Image style={[curStyle.listIcon]} source={item.img} />
                                        <CustomText text = {item.name} style={{color:Theme.fontColor, fontSize:14,marginLeft:10}}/>
                                   </View>
                                   <Ionicons name={'chevron-forward'} size={18} color={'lightgray'} />
                               </View>
                            </TouchableHighlight>
                        )
                    })
                }
            </LinearGradient>
        )
    }
}

export default function(props) {
    const navigation = useNavigation();
    return <PersonalList {...props} navigation={navigation} />;
}
 
/**
 * 公共列表块
 */


const curStyle = StyleSheet.create({
    listIcon: {
        height: 20,
        width: 20,
        // marginBottom:10
    },
    listBottom: {
        borderBottomColor: Theme.lineColor,
        borderBottomWidth: 1
    },
    viewStyle:{
        marginHorizontal:10,
        backgroundColor:'white',
        borderRadius:6,
        marginBottom:88
        // paddingVertical:10,
        // borderRadius:5,
        // flexDirection:'row',
        // alignItems:'center', 
        // borderWidth:1.5,
        // borderColor:Theme.theme,
        // flexWrap: 'wrap',
        // elevation:1.5, shadowColor:'#999999', shadowOffset:{width:5,height:5}, shadowOpacity: 0.2, shadowRadius: 1.5,
    },
    baImageStyle:{
        // backgroundColor:Theme.themeJ,
        // height:35,width:35,
        // borderRadius:17.5,
        // alignItems:'center',
        // justifyContent:'center',
        // elevation:1.5, shadowColor:'#999999', shadowOffset:{width:1,height:1}, shadowOpacity: 0.8, shadowRadius: 3
    }
});