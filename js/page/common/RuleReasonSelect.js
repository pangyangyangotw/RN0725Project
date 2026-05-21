import React from 'react';
import SuperView from '../../super/SuperView';
import {
    ScrollView,
    View,
    StyleSheet,
    TouchableOpacity,
    Text
} from 'react-native';
import CustomText from '../../custom/CustomText';
import CustomTextInput from '../../custom/CustomTextInput';
import Theme from '../../res/styles/Theme';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import ViewUtil from '../../util/ViewUtil';
import Util from '../../util/Util';

export default class RuleReasonSelect extends SuperView {

    constructor(props) {
        super(props);
        this.params = (props.route && props.route.params) || (props.navigation && props.navigation.state && props.navigation.state.params) || {};
        this._navigationHeaderView = {
            title: this.params.title
        }
        this.state = {
            tripReason:''
        }    
    }
    _rowClickAtIndex = (item) => {
        const { callBack } = this.params;
        callBack(item);
        this.pop();
    }
    _continueOrder = (item) => { 
        if(item.Reason||item.ReasonEn){
            const { callBack } = this.params;
            callBack(item);
            this.pop();
        }else{
            this.toastMsg('请填写或选择超标原因');
        }        
    }
    renderBody() {
        const { reason, select } = this.params;
        const {tripReason} = this.state;
        // let reasonCopy = JSON.parse(JSON.stringify(reason&&reason[0]))//序列化反序列化法拷贝
        return (
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="always" style={{margin:10,backgroundColor:'#fff',paddingBottom:20,borderRadius:6}}>                
                {
                    reason.map((item, idnex) => {
                        return (
                            item.Id == 0 ? //添加了一个Id为0的违反原因，用来自己填写
                            <View style={{marginBottom:10}}>
                                <View style={{  marginTop: 10, flexDirection: 'row', height: 44, alignItems: 'center', backgroundColor: 'white', paddingHorizontal: 20 }}>
                                    <CustomText style={{ flex: 2 }} text='其他原因' />
                                    <CustomTextInput returnKeyType='done' 
                                                     style={{ flex: 8 }}  
                                                     placeholder='超标原因' 
                                                    //  value={tripReason?tripReason:(select&&select.Id==0?select.Reason:tripReason)} 
                                                    value={Util.Parse.isChinese()? item.Reason: (item.ReasonEn)} 
                                                     onChangeText={(text) => {
                                                         Util.Parse.isChinese()?
                                                            item.Reason = text:
                                                            item.ReasonEn = text
                                                            this.setState({ tripReason:text })
                                                         }
                                                     }
                                     />
                                     <TouchableOpacity onPress={()=>{ this._continueOrder(item )}}>
                                        <MaterialIcons
                                            name={select && select.Id === item.Id ? 'check-box' : 'check-box-outline-blank'}
                                            size={18}
                                            color={select && select.Id === item.Id ?Theme.theme:Theme.assistFontColor}
                                        />
                                     </TouchableOpacity>
                                </View>
                            </View>
                            :
                            <TouchableOpacity style={styles.rowView} key={idnex} onPress={this._rowClickAtIndex.bind(this, item)}>
                                    <Text numberOfLines={0} style={{ color:Theme.commonFontColor, fontSize:13,width:270}} >{Util.Parse.isChinese()? item.Reason: (item.ReasonEn)}</Text>
                                    <MaterialIcons
                                        name={select && select.Id === item.Id ? 'check-box' : 'check-box-outline-blank'}
                                        size={18}
                                        color={select && select.Id === item.Id ?Theme.theme:Theme.assistFontColor}
                                    />
                            </TouchableOpacity>
                        )
                    })
                }
            </ScrollView>
        )
    }

}

const styles = StyleSheet.create({
    rowView: {
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: Theme.lineColor,
        alignItems: 'center',
        flexDirection: 'row',
        marginHorizontal:20,
        paddingVertical:20,
        justifyContent: 'space-between',
        marginBottom:10
    }
})