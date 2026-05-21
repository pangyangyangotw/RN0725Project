import React from 'react';
import SuperView from '../../super/SuperView';
import {
    View,
    Text,
    StyleSheet,
    TouchableHighlight,
    ScrollView
} from 'react-native';
import Theme from '../../res/styles/Theme';
import Ionicons from 'react-native-vector-icons/Ionicons';
import I18nUtil from '../../util/I18nUtil';
import ViewUtil from '../../util/ViewUtil';
import Util from '../../util/Util';
import CustomText from '../../custom/CustomText';
import NavigationUtils from '../../navigator/NavigationUtils';
import {connect} from 'react-redux';
class FlightRtRuleScreen extends SuperView {

    constructor(props) {
        super(props);
        this.params = (props.route && props.route.params) || (props.navigation && props.navigation.state && props.navigation.state.params) || {};
        this._navigationHeaderView = {
            title: '超标原因'
        };
        this.state = {
            lowPriceData: null,
            beforeDayData: null,
            cabinDisCountData: null,
            canbinData:null,
        }
    }
    componentDidMount() {
        let { lowPriceData, beforeDayData, cabinDisCountData,canbinData } = this.state;
        let data = this.params.MatchTravelRules;
        if (data) {
            data.unmatchlist.forEach(obj => {
                this.params.ViolationRules && this.params.ViolationRules.map((obj2)=>{
                    if(obj.RuleType == obj2.RuleType){
                        if (obj.IsEnable == 1 && obj.LowPriceFight && obj.RuleType == 1) {
                            lowPriceData = {
                                LowestFlight: obj.LowPriceFight,
                                reasonList: data.reasonList
                            }
                        }
                        if (obj.IsEnable == 1 && obj.RuleType == 2) {
                            beforeDayData = {
                                reasonList: data.dayreasonlist,
                                Advanceday: obj.Advanceday
                            }
                        }
                        if (obj.IsEnable == 1 && obj.RuleType == 7) {
                            cabinDisCountData = {
                                reasonList: data.cabinDiscountRsnList,
                                Discount: obj.Discount,
                                bookdiscount: data.bookdiscount,
                                bookdiscounten: data.bookdiscounten,
                                DiscountEn: obj.DiscountEn,
                                rulediscountfloatingvalue: data.rulediscountfloatingvalue
                            }
                        }
                        if (obj.IsEnable == 1 && obj.RuleType == 3) {
                            canbinData = {
                                reasonList: data.cabinLimitRsnList,
                            }
                        }
                    }
                })
            })
        }
        this.setState({
            lowPriceData,
            beforeDayData,
            cabinDisCountData,
            canbinData
        })

    }
    _continueOrder = () => {
        const { lowPriceData, beforeDayData, cabinDisCountData, canbinData } = this.state;
        const {compSwitch} = this.props

        if (lowPriceData && !lowPriceData.selectReaon) {
            this.toastMsg('请选择未选择最低价的原因');
            return;
        }
        if (beforeDayData && !beforeDayData.selectReaon) {
            this.toastMsg('请选择未选择提前预订的原因');
            return;
        }
        if (cabinDisCountData && !cabinDisCountData.selectReaon) {
            this.toastMsg('请选择未预订折扣舱位的原因');
            return;
        }
        if (canbinData && !canbinData.selectReaon) {
            this.toastMsg('请选择未预订指定舱位的原因');
            return;
        }
        let params = Util.Encryption.clone(this.params);
        let ruleModel = {
            MatchTravelRules: params.MatchTravelRules
        }
        let ruleModelArr = [];
        if (lowPriceData) {
            ruleModel.lowPriceReason = lowPriceData.selectReaon;
            ruleModelArr.push(lowPriceData.selectReaon);
        }
        if (beforeDayData) {
            ruleModel.beforeDayReason = beforeDayData.selectReaon;
            ruleModelArr.push(beforeDayData.selectReaon)
        }
        if (cabinDisCountData) {
            ruleModel.cabinDiscountReason = cabinDisCountData.selectReaon;
            ruleModelArr.push(cabinDisCountData.selectReaon)
        }
        if (canbinData) {
            ruleModel.canbinDataReason = canbinData.selectReaon;
            ruleModelArr.push(canbinData.selectReaon);
        }
        params.backRuleModel = ruleModel;
        params.backRuleModelArr = ruleModelArr
        if (lowPriceData) {
            params.backFlightData.LowestFlight = lowPriceData.LowestFlight;
        }
        compSwitch?
        this.push('Flight_compCreatOrderScreen', params)
        :
        this.push('FlightOrderScreeb', params);
    }

    _selectReason = (index) => {
        const { lowPriceData, beforeDayData, cabinDisCountData, canbinData } = this.state;
        let reasonList = [];
        let selectReason = null;
        let title = '';

        if (index === 0 && lowPriceData) {
            reasonList = lowPriceData.reasonList || [];
            selectReason = lowPriceData.selectReaon || null;
            title = '未选择最低价';
        } else if (index === 1 && beforeDayData) {
            reasonList = beforeDayData.reasonList || [];
            selectReason = beforeDayData.selectReaon || null;
            title = '未提前预订的原因';
        } else if (index === 2 && cabinDisCountData) {
            reasonList = cabinDisCountData.reasonList || [];
            selectReason = cabinDisCountData.selectReaon || null;
            title = '未选择指定折扣舱位';
        } else if (index === 3 && canbinData) {
            reasonList = canbinData.reasonList || [];
            selectReason = canbinData.selectReaon || null;
            title = '未选择指定舱位';
        }
        this.push('RuleReasonSelect', {
            reason: reasonList, select: selectReason, title: title, callBack: (reason) => {
                if (index === 0) {
                    lowPriceData.selectReaon = reason;
                } else if (index === 1) {
                    beforeDayData.selectReaon = reason;
                } else if (index === 2) {
                    cabinDisCountData.selectReaon = reason;
                } else if (index === 3) {
                    if (reason.RuleTypeDesc == 'None') {
                        reason.RuleTypeDesc = '未选择指定舱位'
                    }
                    canbinData.selectReaon = reason;
                }
                this.setState({});
            }
        });
    }


    renderBody() {
        const { lowPriceData, cabinDisCountData, beforeDayData, canbinData } = this.state;
        if (lowPriceData && lowPriceData.LowestFlight) {
            lowPriceData.LowestFlight.DepartureDate = Util.Date.toDate(lowPriceData.LowestFlight.DepartureTime);
        }
        let count = 1;
        if (lowPriceData) count++;
        if (cabinDisCountData) count++;
        if (beforeDayData) count++;
        let string=Util.Parse.isChinese() ?'根据贵公司差旅政策规定，您选择的时间段内的最低价航班为：':"The following flight is suggested for bookable flight according to company travel policy."
        return (
            <View style={{ flex: 1 }}>
                <ScrollView style={{ flex: 1 }}>
                {
                    lowPriceData && lowPriceData.LowestFlight ?
                        <View style={{ paddingHorizontal: 20, paddingVertical: 15, backgroundColor: Theme.yellowBg, justifyContent: 'center' }}>
                            <Text style={{ fontSize: 13,color: Theme.theme  }}>
                            <Text style={{ fontSize: 13,color: Theme.theme  }}>{string}</Text>
                                {Util.Parse.isChinese() ? lowPriceData.LowestFlight.AirCodeDesc : lowPriceData.LowestFlight.AirCode} {lowPriceData.LowestFlight.AirCode + lowPriceData.LowestFlight.FlightNumber} {lowPriceData.LowestFlight.DepartureDate.format('HH:mm', false)}{I18nUtil.translate('起飞')} ¥{lowPriceData.LowestFlight.Price}
                            </Text>
                        </View>
                    : null
                }
                {
                    lowPriceData ?
                        <View style={styles.view}>
                            {/* <View style={styles.viewHeader}>
                                <CustomText text='1、根据贵公司差旅政策规定，您未选择最低价舱位航班，故请您选择原因:' />
                            </View> */}
                            <View style={styles.viewHeader}>
                                    <View style={{ flexDirection: 'row' }}>
                                        <CustomText style={{ fontSize: 16, fontWeight: "bold" }} text={'1.'} />
                                        <CustomText style={{ fontSize: 16, fontWeight: "bold" }} text={'违背最低价限制'} />
                                    </View>
                                    <CustomText style={{color: Theme.commonFontColor}} text='根据贵公司差旅政策规定，您未选择最低价舱位航班，故请您选择原因:' />
                            </View>
                            <TouchableHighlight underlayColor='transparent' onPress={this._selectReason.bind(this, 0)}>
                                <View style={styles.viewCenter}>
                                    <CustomText style={{ color: lowPriceData.selectReaon ? 'black' : 'gray' }} text={lowPriceData.selectReaon ? (Util.Parse.isChinese()? lowPriceData.selectReaon.Reason:lowPriceData.selectReaon.ReasonEn) : '请选择'} />
                                    <Ionicons name={'chevron-forward'}
                                        size={20}
                                        style={{ color: 'lightgray' }}
                                    />
                                </View>
                            </TouchableHighlight>
                        </View>
                        : null
                }
                {
                    beforeDayData ?
                        <View style={styles.view}>
                            <View style={styles.viewHeader}>
                                <View style={{ flexDirection: 'row' }}>
                                        <CustomText style={{ fontSize: 16, fontWeight: "bold" }} text={this.state.lowPriceData ? '2.' : '1.' } />
                                        <CustomText style={{ fontSize: 16, fontWeight: "bold" }} text={'违背提前天数限制'} />
                                </View>
                                <Text style={{color: Theme.commonFontColor, fontSize: 13, marginTop: 10}}>
                                    {
                                        Util.Parse.isChinese()?
                                        `根据贵公司差旅政策规定，您未提前${beforeDayData.Advanceday}天预订航班，故请您选择原因:`
                                        :
                                        I18nUtil.tranlateInsert('根据贵公司差旅政策规定，您未提前{{noun}}天预订航班，故请您选择原因:', beforeDayData.Advanceday)
                                    }
                                </Text>
                            </View>
                            <TouchableHighlight underlayColor='transparent' onPress={this._selectReason.bind(this, 1)}>
                                <View style={styles.viewCenter}>
                                    <CustomText style={{ color: beforeDayData.selectReaon ? 'black' : 'gray' }} text={beforeDayData.selectReaon ? (Util.Parse.isChinese()?beforeDayData.selectReaon.Reason:beforeDayData.selectReaon.ReasonEn) : '请选择'} />
                                    <Ionicons name={'chevron-forward'}
                                        size={20}
                                        style={{ color: 'lightgray' }}
                                    />
                                </View>
                            </TouchableHighlight>
                        </View>
                        : null
                }
                {
                    cabinDisCountData ?
                        <View style={styles.view}>
                            <View style={styles.viewHeader}>
                                <View style={{ flexDirection: 'row' }}>
                                        <CustomText style={{ fontSize: 16, fontWeight: "bold" }} text={(this.state.beforeDayData&&this.state.lowPriceData)?'3.':(this.state.beforeDayData||this.state.lowPriceData ? '2.' : '1.' )} />
                                        <CustomText style={{ fontSize: 16, fontWeight: "bold" }} text={'违背折扣限制'} />
                                </View>
                                <Text style={{ color: Theme.commonFontColor, fontSize: 13, marginTop: 10 }}>
                                    {/* {  
                                       Util.Parse.isChinese()?
                                       `根据贵公司差旅政策规定，您未选择经济舱${cabinDisCountData.Discount}折以内航班，故请您选择原因)`
                                       :
                                       I18nUtil.tranlateInsert('根据贵公司差旅政策规定，您未选择经济舱{{noun}}折以内航班，故请您选择原因:', (cabinDisCountData.Discount*10 + '%0ff'))
                                    } */}
                                    {  
                                       cabinDisCountData.rulediscountfloatingvalue?
                                            Util.Parse.isChinese()?
                                            `根据贵公司差旅政策规定，因您选择了经济舱${cabinDisCountData.bookdiscount} 折的航班，违背公司经济舱${cabinDisCountData.Discount == 0?'全部':cabinDisCountData.Discount}折限制加最高浮动金额 ${cabinDisCountData.rulediscountfloatingvalue}，故请您选择原因`
                                            :`According to your company's travel policy, because you did select ECONOMY${cabinDisCountData.bookdiscounten} discount flights, disobeyed your company ECONOMY ${cabinDisCountData.DiscountEn == 0?'全部':cabinDisCountData.DiscountEn} discount plus allowance ${cabinDisCountData.rulediscountfloatingvalue},please select the reason for it:`
                                       :
                                            Util.Parse.isChinese()?
                                            `根据贵公司差旅政策规定，因您选择了经济舱${cabinDisCountData.bookdiscount} 折的航班，违背公司经济舱${cabinDisCountData.Discount == 0?'全部':cabinDisCountData.Discount}折限制，故请您选择原因:`
                                            :`According to your company's travel policy, because you did select ECONOMY${cabinDisCountData.bookdiscounten} discount flights,disobeyed your company ECONOMY ${cabinDisCountData.DiscountEn == 0?'全部':cabinDisCountData.DiscountEn}  discount,please select the reason for it:`
                                    }
                                </Text>
                            </View>
                            <TouchableHighlight underlayColor='transparent' onPress={this._selectReason.bind(this, 2)}>
                                <View style={styles.viewCenter}>
                                    <CustomText style={{ color: cabinDisCountData.selectReaon ? 'black' : 'gray' }} text={cabinDisCountData.selectReaon ? (Util.Parse.isChinese()?cabinDisCountData.selectReaon.Reason:cabinDisCountData.selectReaon.ReasonEn): '请选择'} />
                                    <Ionicons name={'chevron-forward'}
                                        size={20}
                                        style={{ color: 'lightgray' }}
                                    />
                                </View>
                            </TouchableHighlight>
                        </View>
                        : null
                }
                {
                        canbinData ?
                            <View style={styles.view}>
                                <View style={styles.viewHeader}>
                                    <View style={{ flexDirection: 'row' }}>
                                        <Text style={{ fontSize: 16, fontWeight: "bold", color: Theme.fontColor }}>{count+'.'}</Text>
                                        <CustomText style={{ fontSize: 16, fontWeight: "bold" }} text={'舱位限制'} />
                                    </View>
                                    <Text style={{ color: Theme.commonFontColor, fontSize: 13, marginTop: 10 }}>
                                        {
                                            Util.Parse.isChinese() ?
                                                `根据贵公司差旅政策规定，因您所选舱等超出限制，故请您选择原因`
                                                : `According to your company's travel policy, since the cabin class you selected exceeds the limit, please select a reason.`
                                        }
                                    </Text>
                                </View>
                                <TouchableHighlight underlayColor='transparent' onPress={this._selectReason.bind(this, 3)}>
                                    <View style={styles.viewCenter}>
                                    <CustomText 
                                        style={{ color: canbinData?.selectReaon ? Theme.commonFontColor : Theme.promptFontColor }} 
                                        text={canbinData?.selectReaon ? (Util.Parse.isChinese() ? canbinData.selectReaon?.Reason || '' : canbinData.selectReaon?.ReasonEn || '') : '请选择原因'} 
                                    />
                                    <Ionicons 
                                        name="chevron-forward"
                                        size={20}
                                        style={{ color: 'lightgray' }} 
                                    />
                                    </View>
                                </TouchableHighlight>
                            </View>
                            : null
                }
                </ScrollView>
                {
                    ViewUtil.getThemeButton('继续预订', this._continueOrder)
                }
                {/* {
                    lowPriceData && lowPriceData.LowestFlight ?
                        <View style={{ margin: 10 }}>
                            <CustomText text={'根据贵公司差旅政策规定，您选择的时间段内的最低价航班为：'}/>
                            <Text style={{ fontSize: 18, marginTop: 5 }}>{Util.Parse.isChinese() ? lowPriceData.LowestFlight.AirCodeDesc : lowPriceData.LowestFlight.AirCode} {lowPriceData.LowestFlight.AirCode + lowPriceData.LowestFlight.FlightNumber} {lowPriceData.LowestFlight.DepartureDate.format('HH:mm', false)}{I18nUtil.translate('起飞')} ¥{lowPriceData.LowestFlight.Price}</Text>
                        </View> :
                        null} */}
            </View>
        )
    }
}

const getPropsState = state => ({
    compSwitch:state.compSwitch.bool
})
export default connect(getPropsState)(FlightRtRuleScreen);

const styles = StyleSheet.create({
    view: {
        margin: 10,
        backgroundColor: 'white',
        borderRadius: 6
    },
    viewHeader: {
        borderBottomColor: Theme.lineColor,
        borderBottomWidth: 1,
        paddingVertical: 10,
        marginHorizontal: 20
    },
    viewCenter: {
        padding: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: "center",
        paddingHorizontal: 20
    }
})