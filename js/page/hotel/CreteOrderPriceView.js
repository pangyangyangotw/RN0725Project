import React from 'react';
import {
    View,
    Animated,
    Platform,
    Dimensions,
    StyleSheet,
    Easing,
    TouchableOpacity,
    ScrollView
} from 'react-native';
import CustomText from '../../custom/CustomText';
import Theme from '../../res/styles/Theme';

import DeviceUtil from '../../util/DeviceUtil';
import Util from '../../util/Util';
export default class CreateOrderPriceView extends React.Component {



    constructor(props) {
        super(props);
        this.state = {
            visible: false,
            height: new Animated.Value(0),
        }
    }
    getVisible() {
        return this.state.visible;
    }
    show() {
        this.setState({
            visible: true
        }, () => {
            Animated.parallel([
                Animated.timing(this.state.height, {
                    toValue: 300,
                    duration: 200,
                    easing: Easing.linear,
                })
            ]).start();
        })
    }
    hide() {
        Animated.parallel([

            Animated.timing(this.state.height, {
                toValue: 0,
                duration: 200,
                easing: Easing.linear,
            })
        ]).start(() => {
            this.setState({
                visible: false
            })
        });

    }
    _seriveprice = (merchantPrice) => {
        const {roomModel, liveDay, roomCount,ServiceFeesData,travellers} = this.props;
        var serviceFee = 0;
        var VipServiceFee = 0;
        var servicePrice = 0;
        let vip = 0;
        let pub = 0;
        var personList = [];
        travellers&&travellers.forEach(item => {
            // item.map((obj)=>{
            //    personList.push(obj);
            // })
            personList.push(item);
        })
        personList&&personList.forEach((item)=>{
            if (item.IsVip) {
                vip++;
            } else {
                pub++;
            }
        })
        ServiceFeesData&&ServiceFeesData.ServiceFees&&ServiceFeesData.ServiceFees.map((item)=>{//非VIP
            if (item.FeeValueType == 1) {
                serviceFee += Number(item.Price);
            }
            else if (item.FeeValueType == 2) {
                item.Price = Number((item.FeeValue * roomModel.AvgPrice * liveDay).toFixed(2));
                serviceFee += item.Price;
            }
        }) 
        ServiceFeesData&&ServiceFeesData.VipServiceFees&&ServiceFeesData.VipServiceFees.map((item)=>{//VIP
            if (item.FeeValueType == 1) {
                VipServiceFee += Number(item.Price);
            }
            else if (item.FeeValueType == 2) {
                item.Price = Number((item.FeeValue * roomModel.AvgPrice * liveDay).toFixed(2));
                VipServiceFee += item.Price;
            }
        }) 
        
        if(ServiceFeesData.TollType===1){//按夜间收
            if(vip>0){
                servicePrice = VipServiceFee * liveDay * roomCount
            }else{
                servicePrice = serviceFee * liveDay * roomCount  
            }
        }else if(ServiceFeesData.TollType===2){//按订单收取
            if(vip>0){
                servicePrice = VipServiceFee
            }else{
                servicePrice = serviceFee
            }
        }else if(ServiceFeesData.TollType===3){//按房间收取
            if(vip>0){
                servicePrice = VipServiceFee * roomCount
            }else{
                servicePrice = serviceFee * roomCount
            }
        }
        let service = merchantPrice + servicePrice
        return (
            ServiceFeesData.IsShowServiceFee?
            <View>
                {
                    <View style={styles.row}>
                        <CustomText text={'服务费'} />
                        <View>
                            <CustomText text={'¥' + service.toFixed(2)} style={{ color: Theme.theme}} />
                        </View>
                    </View>
                }
                {
                    vip > 0 ? 
                    ServiceFeesData&&ServiceFeesData.VipServiceFees&&ServiceFeesData.VipServiceFees.map((obj,index)=>{
                         let amount;
                         if (obj.FeeValueType == 1) {
                            amount = Number(obj.Price);
                        }
                        else if (obj.FeeValueType == 2) {
                           amount= Number((obj.FeeValue * roomModel.AvgPrice * liveDay).toFixed(2));
                        }
                        if(ServiceFeesData.TollType===1){//按夜间收
                            // if(vip>0){
                                amount = amount * liveDay * roomCount
                        }else if(ServiceFeesData.TollType===2){//按订单收取
                           
                        }else if(ServiceFeesData.TollType===3){//按房间收取
                            // if(vip>0){
                                amount = amount * roomCount
                            // }else{
                            //     servicePrice = serviceFee * roomCount
                            // }
                        }
                        return (
                            <View style={styles.row}>
                            <CustomText text={'  ' + (Util.Parse.isChinese() ? obj.Name : obj.EnName)} />
                            <View>
                                <CustomText text={'¥' + amount.toFixed(2) } style={{ color: Theme.theme}} />
                            </View>
                        </View>
                        )
                    }):
                    ServiceFeesData&&ServiceFeesData.VipServiceFees&&ServiceFeesData.ServiceFees.map((obj,index)=>{
                        let amount;
                        if (obj.FeeValueType == 1) {
                           amount = Number(obj.Price);
                       }
                       else if (obj.FeeValueType == 2) {
                          amount= Number((obj.FeeValue * roomModel.AvgPrice * liveDay).toFixed(2));
                       }
                       if(ServiceFeesData.TollType===1){//按夜间收
                           // if(vip>0){
                               amount = amount * liveDay * roomCount
                       }else if(ServiceFeesData.TollType===2){//按订单收取
                          
                       }else if(ServiceFeesData.TollType===3){//按房间收取
                           // if(vip>0){
                               amount = amount * roomCount
                           // }else{
                           //     servicePrice = serviceFee * roomCount
                           // }
                       }
                       return (
                           <View style={{flexDirection:'row',justifyContent: "space-between",paddingLeft: 5,paddingRight: 10,alignItems: 'center',paddingVertical:3}}>
                           <CustomText text={'  ' + (Util.Parse.isChinese() ? obj.Name : obj.EnName)} style={{color:Theme.aidFontColor,width:240,marginLeft:20}}/>
                           <View>
                               <CustomText text={'¥' + amount.toFixed(2) } style={{ color:Theme.aidFontColor}} />
                           </View>
                       </View>
                       )
                   })
                }
            </View>
            :null
        )
    }


    render() {
        const { visible } = this.state;
        const { roomModel, liveDay, roomCount, RcModel,paymentDesc,ApplyTravelRule,CompanyPartPriceByMergerTravelRules,ServicePrice,totalPrice,merchantPrice,serviceP,ServiceFeesData } = this.props;
        if (!visible) return null;
        let companyCost = 0;
        let peronalCost = 0;
        let PriceLimit = 0;
        if (RcModel){
            PriceLimit = parseFloat(RcModel&&RcModel.PriceLimit);
        }
        if(ApplyTravelRule){
            if(CompanyPartPriceByMergerTravelRules && CompanyPartPriceByMergerTravelRules>0){
                companyCost =  parseFloat(roomModel.TotalPrice)  * roomCount > CompanyPartPriceByMergerTravelRules * liveDay ? CompanyPartPriceByMergerTravelRules * liveDay : parseFloat(selectRoom.TotalPrice) * roomCount;
            }else{
                const { IsUsedApplyBudget, RestApplyBudget, ViolationMode } = ApplyTravelRule;
                if(IsUsedApplyBudget && ViolationMode == 3){
                    companyCost = (roomModel.AvgPrice * liveDay * roomCount) > RestApplyBudget ? RestApplyBudget : (selectRoom.AvgPrice * liveDay * roomCount);
                }
                //前台现付不计算公司或个人金额
                else if (RcModel && (RcModel.CityLevelLimit || RcModel.StarRateLimit || RcModel.AdvanceDayLimit) && (ViolationMode == 3 || ViolationMode == 4)) {
                    companyCost = PriceLimit * liveDay * roomCount;
                } else {
                    companyCost = roomModel.TotalPrice * roomCount;
                }
            }}else{
                if (RcModel && (RcModel.ViolationMode == 3 || RcModel.ViolationMode==4) && paymentDesc != '信用卡预付') {
                    companyCost = PriceLimit * liveDay * roomCount;
                } else {
                    companyCost = roomModel.TotalPrice * roomCount;
                }  
        }
        companyCost = companyCost
        if(ApplyTravelRule){
            if(CompanyPartPriceByMergerTravelRules && CompanyPartPriceByMergerTravelRules>0){
                peronalCost = (parseFloat(roomModel.TotalPrice) - CompanyPartPriceByMergerTravelRules * liveDay) * roomCount < 0 ?
                0 : (parseFloat(roomModel.TotalPrice) - CompanyPartPriceByMergerTravelRules * liveDay) * roomCount;
            }else{
                const { IsUsedApplyBudget, RestApplyBudget, ViolationMode } = ApplyTravelRule;
                if(IsUsedApplyBudget && ViolationMode == 3){
                    let price = ((parseFloat(roomModel.AvgPrice) - PriceLimit) * liveDay * roomCount);
                    peronalCost = price>RestApplyBudget? price - RestApplyBudget : 0;
                }
                //前台现付不计算公司或个人金额
                else if (parseFloat(roomModel.AvgPrice) > PriceLimit &&  RcModel && (RcModel.CityLevelLimit || RcModel.StarRateLimit || RcModel.AdvanceDayLimit) && (ViolationMode == 3 || ViolationMode == 4)) {
                    peronalCost = (parseFloat(roomModel.AvgPrice) - PriceLimit) * liveDay * roomCount; 
                }
                }
        }else{            
                if (RcModel && (RcModel.ViolationMode == 3||RcModel.ViolationMode == 4) && roomModel.TotalPrice > PriceLimit) {
                    peronalCost = (parseFloat(roomModel.TotalPrice) - (PriceLimit * liveDay)) * roomCount;
                }
        }
        let WH = Dimensions.get('window').height;
        return (
            <View style={[styles.view, { width: screenWidth, height: DeviceUtil.is_iphonex() ? (WH - 84):(Platform.OS === 'ios' ? WH-64:WH-30+50) }]}>
                <TouchableOpacity style={{ flex: 1 }} onPress={() => {
                    this.props.callBack && this.props.callBack();
                }}></TouchableOpacity>
                <Animated.View style={{ height: this.state.height, backgroundColor: 'white' }}>
                    <View>
                    <ScrollView>
                    {
                      roomModel.PaymentType == 1 && (PriceLimit != 0 && CompanyPartPriceByMergerTravelRules!=0)?
                        <View style={styles.row}>
                            <CustomText text={'当前城市差标'} />
                            <View>
                                <CustomText text={'¥' + (CompanyPartPriceByMergerTravelRules>0?CompanyPartPriceByMergerTravelRules:PriceLimit)} style={{ }} />
                            </View>
                        </View>
                      :null
                    }
                    <View style={styles.row}>
                        <CustomText text={paymentDesc} style={{ width:240 }} />
                        <View>
                            <CustomText text={'¥' + (companyCost.toFixed(2))} style={{ color: Theme.theme }} />
                        </View>
                    </View>
                    {
                        paymentDesc ==='企业月结' ?
                        <View style={styles.row}>
                            <CustomText text='个人超标现付' style={{ width:240 }} />
                            <View>
                                <CustomText text={'¥' + peronalCost.toFixed(2)} style={{ color: Theme.theme }} />
                            </View>
                        </View>:null
                    }
                    {
                        this._seriveprice(merchantPrice)
                    }
                    { !ServiceFeesData.IsShowServiceFee || merchantPrice==0 ? null :
                        <View style={[styles.row,{marginLeft:10}]}>
                            <CustomText text='刷卡手续费' />
                            <View>
                                <CustomText text={'¥' + merchantPrice } style={{ color: Theme.theme }} />
                            </View>
                        </View>
                    }

                    <View style={styles.row}>
                        <CustomText text='每晚均价' />
                        <View>
                            <CustomText text={'¥' + roomModel.AvgPrice.toFixed(2)} style={{ color: Theme.theme }} />
                        </View>
                    </View>
                    {roomModel.Tax?<View style={styles.row}>
                        <CustomText text='税费' />
                        <View>
                            <CustomText text={'¥' + roomModel.Tax.toFixed(2)} style={{ color: Theme.theme }} />
                        </View>
                    </View>:null}
                    <CustomText style={{marginLeft:10}} text='每日价格' />
                    {
                        roomModel?.NightlyRates?.map((item, index) => {
                            return (
                                <View style={styles.row}>
                                    <CustomText text={item.Date} />
                                    <View>
                                        <CustomText text={'¥' + item.Price.toFixed(2)} style={{ color: Theme.theme }} />
                                    </View>
                                </View>
                            )
                            
                        })
                    }
                    <View style={{height:100}}></View>
                    </ScrollView>
                    </View>
                </Animated.View>
            </View>
        )

    }
}



const styles = StyleSheet.create({
    view: {
        position: 'absolute',
        top: DeviceUtil.is_iphonex() ? -88 : (Platform.OS === 'ios' ? -64 : -70),
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'flex-end',

    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: "space-between",
        padding: 10
    }
})