import React from 'react';
import {
    View,
    StyleSheet,
    ImageBackground,
    TouchableOpacity
} from 'react-native';
import Theme from '../../res/styles/Theme';
import CustomText from '../../custom/CustomText';
import PropTypes from 'prop-types';
// import { withNavigation } from 'react-navigation';
import { useNavigation } from '@react-navigation/native';
import TrainService from '../../service/TrainService';
import StorageUtil from '../../util/StorageUtil';

class RelateTrainView extends React.Component {

    static propTypes = {
        otwThis: PropTypes.object.isRequired
    }
    constructor(props) {
        super(props);
        this.state={
            login12306Name:this.props.login12306Name,
            passWord:this.props.login12306Name,
            login12306Data:this.props.login12306Name
        }
    }

    render() {
        const { login12306Name } = this.state;
        return (
            <View style={styles.viewStyle}>  
                <View style={{flexDirection:'row',alignItems:'center'}}>
                    <ImageBackground style={{width:38,height:38}} source={require('../../res/Uimage/trainFloder/train12306.png')}/>
                    {login12306Name?
                    <View style={{flexDirection:'row',flex:1,justifyContent:'space-between'}}>
                        <View style={{}}>
                            <CustomText style={{fontSize:14,marginLeft:10}} text={login12306Name}/>
                            <CustomText style={{fontSize:12,marginLeft:10,color:Theme.theme}} text={'已关联'}/>
                        </View>
                        <View style={{flexDirection:'row',alignItems:'center'}}>
                            <TouchableOpacity onPress={this._logoutClick} style={styles.toucStyle}>
                                <CustomText style={{fontSize:14,color:Theme.theme,paddingHorizontal:10}} text={'退出'}></CustomText>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={this._relateClick2} style={styles.toucStyle2}>
                                <CustomText style={{fontSize:14,color:'#fff',paddingHorizontal:10}} text={'切换'}></CustomText>
                            </TouchableOpacity>
                        </View>
                    </View>
                    :
                    <View style={{flexDirection:'row',alignItems:'center',width:global.screenWidth-78}}>
                        <View style={{marginLeft:10,flex:10}}>
                            <CustomText style={{fontSize:14,fontWeight:'bold',color:Theme.commonFontColor}} text='铁路局规定购票必须实名制'/>
                            <CustomText style={{marginTop:5,fontSize:12,color:Theme.assistFontColor}} text='登录12306账号提高出票成功率' />
                        </View>
                        <TouchableOpacity onPress={this._relateClick1} style={styles.toucStyle3}>
                                <CustomText style={{fontSize:14,color:'#fff'}} text={'关联'}></CustomText>
                        </TouchableOpacity>
                    </View>
                    }
                </View>
            </View> 
        )
    }

    //退出绑定12306
    _logoutClick =() =>{
        const {otwThis} = this.props;
        const {login12306Name} = this.state
        otwThis.showLoadingView();
        let model = {
            trainAccount:login12306Name, 
        }
        TrainService.TrainAccountCancelApp(model).then(response => {
            otwThis.hideLoadingView();
            if (response && response.success) {
                this.setState({
                    login12306Name:null,
                    login12306Data:null
                },()=>{
                    StorageUtil.saveKey('login12306Data',null);
                })
            } else {
                otwThis.toastMsg(response.message || '退出12306账号失败');
            }
        }).catch(error => {
            otwThis.hideLoadingView();
            otwThis.toastMsg(error.message || '退出12306账号异常');
        })
    }

    _relateClick1= ()=>{
        const {otwThis} = this.props;
        otwThis.push('TrainRelateScreen',{callBack:(name,passWord,data)=>{
            this.setState({
                login12306Name:name,
                passWord:passWord,
                login12306Data:data
            },()=>{
                StorageUtil.saveKey('login12306Data',data);
            })
        }})
    }
    _relateClick2= ()=>{
        const {otwThis} = this.props;
        otwThis.push('TrainRelateScreen',{_switch:true, callBack:(name,passWord,data)=>{
            this.setState({
                login12306Name:name,
                passWord:passWord,
                login12306Data:data
            },()=>{
                StorageUtil.saveKey('login12306Data',data);
            })
        }})
    }
   
}
// export default withNavigation(RelateTrainView);

export default function(props) {
    const navigation = useNavigation();
    return (
        <RelateTrainView {...props} navigation={navigation} />
    )
}

const styles = StyleSheet.create({
    viewStyle:{
        flexDirection:'row',
        // justifyContent:'space-between',
        alignItems:'center',
        padding:10,
        alignContent:'center',
        backgroundColor:'#fff',
        marginHorizontal:10,
        borderRadius:6
    },
    toucStyle:{
        height:24,
        backgroundColor:Theme.greenBg,
        borderRadius:4,
        justifyContent:'center',
        alignItems:'center',
        borderStartWidth:1,
        borderColor:Theme.theme,
        borderWidth:1
    },
    toucStyle2:{
        height:24,
        backgroundColor:Theme.theme,
        borderRadius:4,
        justifyContent:'center',
        alignItems:'center',
        marginLeft:5
    },
    toucStyle3:{
        // right:10,
        height:24,
        backgroundColor:Theme.theme,
        borderRadius:4,
        justifyContent:'center',
        alignItems:'center',
        flex:3
       
    }
   
})