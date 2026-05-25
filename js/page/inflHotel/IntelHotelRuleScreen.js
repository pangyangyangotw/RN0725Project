import React from 'react';
import {
    View,
    StyleSheet,
    TouchableHighlight,
    Text
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import SuperView from '../../super/SuperView';
import CustomText from '../../custom/CustomText';
import Theme from '../../res/styles/Theme';
import ViewUtil from '../../util/ViewUtil';
import {connect} from 'react-redux'
import Util from '../../util/Util';
class IntelHotelRuleScreen extends SuperView {

    constructor(props) {
        super(props);
        this.param = (props.route && props.route.params) || (props.navigation && props.navigation.state && props.navigation.state.params) || {};
        this.params = this.param.model || {};
        this.paramItems = this.param.item || {};
        this.JourneyId = this.param.JourneyId || 0;
        this._navigationHeaderView = {
            title: '超标原因'
        }
        this.state = {
            reason: null,
            reason2: null,
            reason3: null,
        }
    }
    /**
     * 
     */
    _toContinuteOrder = () => {
        const { compSwitch } = this.props;
        if(this.params.CustomerReason1){
            if (!this.state.reason) {
                this.toastMsg('请选择未预订低价酒店的原因');
                return;
            }
        }
        if(this.params.CustomerReason2){
            if (!this.state.reason2) {
                this.toastMsg('请选择预订不符合星级酒店的原因');
                return;
            }
        }
        if(this.params.CustomerReason3){
            if (!this.state.reason3) {
                this.toastMsg('请选择未提前预定酒店的原因');
                return;
            }
        }
        this.params.RcReason = [this.state.reason,this.state.reason2,,this.state.reason3];
        // this.push('HotelOrder', { ...this.params });
        compSwitch?
        this.push('IntlHotel_compCreateOrderScreen', { model:this.params, item: this.paramItems, JourneyId:this.JourneyId})
        : 
        this.push('InterHotelOrder', { model:this.params, item: this.paramItems, JourneyId:this.JourneyId});
    }
    /**
     *   选择未预订低价酒店原因
     */
    _selectReason = () => {
        this.push('RuleReasonSelect', {
            title: '未预订低价酒店的原因',
            reason: this.params.CustomerReason1,
            select: this.state.reason,
            callBack: (obj) => {
                this.setState({
                    reason: obj
                })
            }
        })
    }
    /**
     * 
     * @returns 请选择未预定符合星级酒店的原因
     */
    _selectStarReason = () => {
        this.push('RuleReasonSelect',{
            title:'未预订符合星级酒店的原因',
            reason: this.params.CustomerReason2,
            select: this.state.reason2,
            callBack: (obj)=>{
                this.setState({
                    reason2:obj
                })
            }

        })
    }
    /**
     * 
     * @returns 请选择未预定符合星级酒店的原因
     */
    _selectDayrReason = () => {
        this.push('RuleReasonSelect',{
            title:'请选择未提前预定酒店的原因',
            reason: this.params.CustomerReason3,
            select: this.state.reason3,
            callBack: (obj)=>{
                this.setState({
                    reason3:obj
                })
            }
        })
    }
    renderBody() {
        const { reason, reason2,reason3 } = this.state;
        return (
            <View style={{ flex: 1 }}>
                <View style={{ flex: 1 }}>
                {this.params.CustomerReason1?
                <View style={styles.view}>
                    <View style={styles.viewHeader}>
                        <View style={{ flexDirection: 'row' }}>
                                <CustomText style={{ fontSize: 16, fontWeight: "bold" }} text={'1'} />
                                <CustomText style={{ fontSize: 16, fontWeight: "bold" }} text={'违背最低价限制'} />
                        </View>
                        <CustomText text='请选择未预订低价酒店的原因' style={{marginTop:10}}/>
                    </View>
                    <TouchableHighlight underlayColor='transparent' onPress={this._selectReason}>
                        <View style={styles.viewCenter}>
                            <CustomText style={{ color: reason ? Theme.commonFontColor : Theme.promptFontColor }} text={reason ? (Util.Parse.isChinese()? reason.Reason:reason.ReasonEn) : '请选择'} />
                            <Ionicons name={'chevron-forward'}
                                size={20}
                                style={{ color: 'lightgray' }}
                            />
                        </View>
                    </TouchableHighlight>
                </View>:null
                }
                {this.params.CustomerReason2?
                <View style={styles.view}>
                    <View style={styles.viewHeader}>
                            <View style={{ flexDirection: 'row' }}>
                                <CustomText style={{ fontSize: 16, fontWeight: "bold" }} text={this.params.CustomerReason1?'2':'1'} />
                                <CustomText style={{ fontSize: 16, fontWeight: "bold" }} text={'违背星级限制'} />
                            </View>
                        <CustomText text='请选择未预订符合星级酒店的原因' style={{marginTop:10}}/>
                    </View>
                    <TouchableHighlight underlayColor='transparent' onPress={this._selectStarReason}>
                        <View style={styles.viewCenter}>
                            <CustomText style={{ color: reason2 ? Theme.commonFontColor : Theme.promptFontColor }} text={reason2 ? (Util.Parse.isChinese()?reason2.Reason:reason2.ReasonEn) : '请选择'} />
                            <Ionicons name={'chevron-forward'}
                                size={20}
                                style={{ color: 'lightgray' }}
                            />
                        </View>
                    </TouchableHighlight>
                </View>:null
                }
                {this.params.CustomerReason3?
                <View style={styles.view}>
                    <View style={styles.viewHeader}>
                        <View style={{ flexDirection: 'row' }}>
                            <Text style={{ fontSize: 16, fontWeight: "bold", color: Theme.fontColor }}>{(this.params.CustomerReason2 && this.params.CustomerReason1) ? '3.' : (this.params.CustomerReason2 || this.params.CustomerReason1 ? '2.' : '1.')}</Text>
                            <CustomText style={{ fontSize: 16, fontWeight: "bold" }} text={'违背提前天数限制'} />
                        </View>
                        <CustomText text='请选择未提前预定酒店的原因' style={{marginTop:10}}/>
                    </View>
                    <TouchableHighlight underlayColor='transparent' onPress={this._selectDayrReason}>
                        <View style={styles.viewCenter}>
                            <CustomText style={{ color: reason3 ? Theme.commonFontColor : Theme.promptFontColor }} text={reason3 ? (Util.Parse.isChinese()?reason3.Reason:reason3.ReasonEn) : '请选择'} />
                            <Ionicons name={'chevron-forward'}
                                size={20}
                                style={{ color: 'lightgray' }}
                            />
                        </View>
                    </TouchableHighlight>
                </View>:null
                }
                </View>
                {
                    ViewUtil.getThemeButton('继续预订', this._toContinuteOrder)
                }
            </View>
        )
    }
}
const getStatePorps = state => ({
    compSwitch: state.compSwitch.bool,
})
export default connect(getStatePorps)(IntelHotelRuleScreen);
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