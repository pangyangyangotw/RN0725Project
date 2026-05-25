import React from 'react';
import {
    TouchableHighlight,
    View,
    StyleSheet
} from 'react-native';
import SuperView from '../../super/SuperView';
import Theme from '../../res/styles/Theme';
import CustomText from '../../custom/CustomText';
import AntDesign from 'react-native-vector-icons/AntDesign';
import { connect } from 'react-redux';
import Ionicons from 'react-native-vector-icons/Ionicons';
import CustomeTextInput from '../../custom/CustomTextInput';
import ViewUtil from '../../util/ViewUtil';
class AddNewFlightCardScreen extends SuperView {
    constructor(props) {
        super(props);
        this.params = (props.route && props.route.params) || (props.navigation && props.navigation.state && props.navigation.state.params) || {};
        this._navigationHeaderView = {
            title: '新增航空常客卡'
        }
        this._tabBarBottomView = {
            bottomInset: true,
            bottomColor: 'white'
        }
        this.state = {
            AirPortName:null,
            SerialNumber:null,
            AirPortId:null,
        }
    }
    
    _addTraveller = () => {
        const {AirPortName, AirPortId, SerialNumber} = this.state;
        const { callBack } = this.params;
        if(!AirPortName){
            this.toastMsg('请选择航空公司');
            return;
        }
        if(!SerialNumber){
            this.toastMsg('请输入航空会员卡号');
            return;
        }
        let cardItem = {
            AirPortName:AirPortName,
            AirPortId:AirPortId,
            SerialNumber:SerialNumber,
        }
        callBack(cardItem);
        this.pop();
    }
   
    renderBody() {
        const { AirPortName,SerialNumber } = this.state;
        return (
            <View style={{flex:1}}>
                <View style={{ margin:10,pading:20,borderRadius:10,backgroundColor:'#fff'}}>
                    <View style={styles.row2}>
                        <CustomText text='航空公司' style={{ flex: 3,fontSize:14 }} />
                        <View style={styles.right}>
                            <CustomText style={{ flex: 1, color:AirPortName?'#000':'#ccc',fontSize:14 }} placeholder={'请选择航空公司'} text={AirPortName?AirPortName:'请选择航空公司'} onPress={() => {
                                this.push('FlightCompany',
                                {
                                    refresh: (item) => {
                                        this.setState({
                                            AirPortName:item.text,
                                            AirPortId:item.id
                                        });
                                    },
                                }
                                );
                            }} />
                            <Ionicons name={'ios-arrow-forward'} size={20} color={'lightgray'} />
                        </View>
                    </View> 
                    <View style={styles.row3}>
                        <CustomText text='航空会员卡号' style={{ flex: 3 }} />
                        <View style={{height:38,flex: 7,justifyContent:'center'}}>
                            <CustomeTextInput 
                                style={{ flex: 7 }} placeholder='请输入航空会员卡号'
                                value={SerialNumber}
                                onChangeText={(text) => {
                                        this.setState({
                                            SerialNumber:text
                                        });
                                }}
                            />
                        </View>
                    </View>       
                </View>
                <View style={{marginHorizontal:10,borderRadius:6,backgroundColor:'#fff',paddingHorizontal:4,marginTop:20}}>
                    {
                        ViewUtil.getSubmitButton2('确认',this._addTraveller)
                    }   
                </View>
               
            </View>
        )
    }
}
const getStateProps = state => ({
    customerInfo_userInfo: state.customerInfo_userInfo
})
export default connect(getStateProps)(AddNewFlightCardScreen);

const styles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        flex: 1,
        height: 60,
        borderBottomColor: Theme.lineColor,
        borderBottomWidth: 1,
        backgroundColor: 'white',
        alignItems: 'center',
        paddingHorizontal: 10
    },
    row2: {
        flexDirection: 'row',
        height: 44,
        borderBottomColor: Theme.lineColor,
        borderBottomWidth: 1,
        alignItems: 'center',
        backgroundColor: 'white', 
        marginHorizontal:20 
    },
    row3: {
        flexDirection: 'row',
        height: 44,
        // borderBottomColor: Theme.lineColor,
        // borderBottomWidth: 1,
        alignItems: 'center',
        backgroundColor: 'white', 
        marginHorizontal:20 
    },
    right: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 7,
    },
})