import React from 'react';
import {
    View,
    StyleSheet,
    TouchableHighlight
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import SuperView from '../../super/SuperView';
import CustomText from '../../custom/CustomText';
import Theme from '../../res/styles/Theme';
import ViewUtil from '../../util/ViewUtil';
import {connect} from 'react-redux'
import Util from '../../util/Util';
 class TrainRuleScreen extends SuperView {

    constructor(props) {
        super(props);
        this.params = (props.route && props.route.params) || (props.navigation && props.navigation.state && props.navigation.state.params) || {};
        this._navigationHeaderView = {
            title: '超标原因'
        }
        this.state = {
            reason: null
        }
    }
    /**
     * 
     */
    _toContinuteOrder = () => {
        if (!this.state.reason) {
            this.toastMsg('请选择预订不可选席别的原因');
            return;
        }
        const { compSwitch } = this.props;
        this.params.ticket.RcReason = this.state.reason;
        const{ticket,recommendTrain,seat,callBack} = this.params;
        if(callBack){
            callBack(this.state.reason);
        }
        compSwitch?
          this.push('Train_compCreateOrderScreen', { ticket: ticket ,recommendTrain:recommendTrain,seat,JourneyId:this.params.JourneyId })
          :
          this.push('TrainCreateOrder', { ticket: ticket ,recommendTrain:recommendTrain,seat,JourneyId:this.params.JourneyId});
    }
    /**
     *   选择原因
     */
    _selectReason = () => {
        this.push('RuleReasonSelect', {
            title: '未预订指定席别的原因',
            reason: this.params.ticket.CustomerReason,
            select: this.state.reason,
            callBack: (obj) => {
                this.setState({
                    reason: obj
                })
            }
        })
    }
    renderBody() {
        const { reason } = this.state;
        return (
            <View style={{ flex: 1 }}>
                <View style={{ flex: 1 }}>
                    <View style={styles.view}>
                        <View style={styles.viewHeader}>
                                <View style={{ flexDirection: 'row' }}>
                                    <CustomText style={{ fontSize: 16, fontWeight: "bold" }} text={'1.'} />
                                    <CustomText style={{ fontSize: 16, fontWeight: "bold" }} text={'违背席别限制'} />
                                </View>
                            <CustomText text='请选择预订不可选席别的原因' />
                        </View>
                        <TouchableHighlight underlayColor='transparent' onPress={this._selectReason}>
                            <View style={styles.viewCenter}>
                                <CustomText style={{ color: reason ? Theme.commonFontColor : Theme.promptFontColor }} text={reason ? (Util.Parse.isChinese()? reason.Reason: reason.ReasonEn ) : '请选择'} />
                                <Ionicons name={'chevron-forward'}
                                    size={20}
                                    style={{ color: 'lightgray' }}
                                />
                            </View>
                        </TouchableHighlight>
                    </View>
                </View>
                {
                    ViewUtil.getThemeButton('继续预订', this._toContinuteOrder)
                }
            </View>
        )
    }
}
const getStatusProps = state => ({
    compSwitch: state.compSwitch.bool
})
export default connect(getStatusProps)(TrainRuleScreen)
const styles = StyleSheet.create({
    view: {
        margin: 10,
        backgroundColor: 'white',
        borderRadius: 6,
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