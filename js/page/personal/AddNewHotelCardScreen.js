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

class AddNewHotelCardScreen extends SuperView {
    constructor(props) {
        super(props);
        this.params = (props.route && props.route.params) || (props.navigation && props.navigation.state && props.navigation.state.params) || {};
        this._navigationHeaderView = {
            title: '新增酒店常客卡'
        }
        this._tabBarBottomView = {
            bottomInset: true,
            bottomColor: 'white'
        }
        this.state = {
            HotelGroupName:null,
            SerialNumber:null,
            HotelGroupId:null,
        }
    }
    
    _addTraveller = () => {
        const {HotelGroupName, HotelGroupId, SerialNumber} = this.state;
        const { callBack } = this.params;
        if(!HotelGroupName){
            this.toastMsg('请选择酒店集团');
            return;
        }
        if(!SerialNumber){
            this.toastMsg('请输入酒店会员卡号');
            return;
        }
        let cardItem = {
            HotelGroupName:HotelGroupName,
            HotelGroupId:HotelGroupId,
            SerialNumber:SerialNumber,
        }
        callBack(cardItem);
        this.pop();
    }
   
    renderBody() {
        const { HotelGroupName,SerialNumber } = this.state;
        return (
            <View style={{flex:1}}>
                <View style={{ margin:10,pading:20,borderRadius:10,backgroundColor:'#fff'}}>
                 <View style={styles.row2}>
                    <CustomText text='酒店集团' style={{ flex: 3 }} />
                    <View style={styles.right}>
                        <CustomText style={{ flex: 1, color:HotelGroupName?'#000':'#ccc' }} placeholder={'请选择酒店集团'} text={HotelGroupName?HotelGroupName:'请选择酒店集团'} onPress={() => {
                            this.push('HotelCompanyScreen',
                            {
                                refresh: (item) => {
                                    this.setState({
                                        HotelGroupName:item.text,
                                        HotelGroupId:item.id
                                    });
                                },
                            }
                            );
                        }} />
                        <Ionicons name={'ios-arrow-forward'} size={20} color={'lightgray'} />
                    </View>
                </View> 
                <View style={styles.row3}>
                    <CustomText text='酒店会员卡号' style={{ flex: 3 }} />
                    <View style={{height:38,flex: 7,justifyContent:'center'}}>
                        <CustomeTextInput 
                            style={{ flex: 7 }} placeholder='请输入酒店会员卡号'
                            value={SerialNumber}
                            onChangeText={(text) => {
                                    this.setState({
                                        SerialNumber:text
                                    });
                            }}
                        />
                    </View>
                </View>       
                {/* <TouchableHighlight underlayColor='transparent' onPress={this._addTraveller}>
                    <View style={{ height: 40, backgroundColor: Theme.theme, justifyContent: "center", alignItems: 'center', flexDirection: 'row', marginTop:40 }}>
                        <AntDesign name={'adduser'} size={26} color={Theme.theme} />
                        <CustomText text={'确认'} style={{ color:'#fff', marginLeft: 5,fontSize:17 }} />
                    </View>
                </TouchableHighlight> */}
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
export default connect(getStateProps)(AddNewHotelCardScreen);

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