import React from 'react';
import {
    View,
    Text
} from 'react-native';
import SuperView from '../../super/SuperView';
import Theme from '../../res/styles/Theme';
import CustomText from '../../custom/CustomText';
export default class NoticeListScreen extends SuperView {
    constructor(props) {
        super(props);
        this.params = (props.route && props.route.params) || (props.navigation && props.navigation.state && props.navigation.state.params) || {};
        this._navigationHeaderView = {
            title: '注销账户说明'
        }
    }
    renderBody() {

        return (
            <View style={{ flex: 1, padding: 10 }}>
                <View style={{
                    borderColor: Theme.theme,
                    borderWidth: 0.5,
                    padding:20,
                    borderRadius:6,
                    backgroundColor:'#fff'
                }}>
                    <CustomText style={{marginTop:10, fontSize:14}} text={'如何注销账户？'}/>
                    <CustomText style={{marginTop:20, fontSize:14, color:Theme.commonFontColor}} text={'此账户用于登录FCM商旅预订一站式平台（包括PC端、H5和APP端）。注销前，请务必确认该账号下是否还有未使用的服务，包括行程、出差申请单、报销单。注销后，原账号下所有订单将不再可见，请慎重。'} />
                    <CustomText style={{marginTop:20, fontSize:14, color:Theme.commonFontColor}} text={'如果确认需要注销，请通过邮箱联系客服团队操作，联系方式详见侧栏菜单底部，或点击"呼叫客服"，与我们的服务团队通话。收到您的申请后，我们将于迟不超过十个工作日为您注销账号。'} />
                </View>
            </View>
        )
    }
}
