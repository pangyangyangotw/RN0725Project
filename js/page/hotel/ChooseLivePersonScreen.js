import React from 'react';
import {
    View,
    FlatList,
    StyleSheet,
    TouchableOpacity
} from 'react-native';
import SuperView from '../../super/SuperView';
import CustomText from '../../custom/CustomText';
import Theme from '../../res/styles/Theme';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import ViewUtil from '../../util/ViewUtil';
import Util from '../../util/Util'


export default class ChooseLivePersonScreen extends SuperView {
    constructor(props) {
        super(props);
        this.params = (props.route && props.route.params) || (props.navigation && props.navigation.state && props.navigation.state.params) || {};
        this.passengers = Util.Encryption.clone(this.params.passengers);
        this._navigationHeaderView = {
            title:'选择合住人',
            rightButton: ViewUtil.getRightButton('保存',this._rightClick),
            leftButton:<View></View>

        }
        this._tabBarBottomView = {
            bottomInset: true
        }
        this.state = {
            keyWord: '',
            projectList: [],
            shareRoomSelect:false,
            sharePersons:[],
        }
    }

    componentDidMount() {
        this._reloadProjectList();
    }

    _reloadProjectList = () => {
        const { travellers } = this.params;
        const { projectList } = this.state;
        travellers.map((item)=>{
            if(!item.shareRoomSelect){
                projectList.push(item);
            }
        })
        this.setState({
            projectList:projectList
        })
    }

    _rightClick =() =>{
        const {projectList} = this.state;
        const { shareCallBack, travellers,shareSingleArr } = this.params;
        let arr = [];
        projectList.map((item)=>{
            if(item&&item.shareRoomSelect){
                arr.push(item)
            }
        })
        // if(shareSingleArr.concat(arr).length>2){
        //     this.toastMsg('合住不能超过两人');
        //     return;
        // }
        arr&&arr.length==0? null :shareCallBack(travellers,shareSingleArr.concat(arr))
        this.pop();
    }

    _backOrderClick = (item) => {
        this.params.callBack(item);
        this.pop();
    }

    _renderItem = ({ item }) => {
        return (
            <TouchableOpacity style={styles.viewStyle}
                              onPress = {()=>{
                                  item.shareRoomSelect = !item.shareRoomSelect
                                  this.setState({})
                              }}
            >
                <View style={styles.borderStyle}> 
                   <MaterialIcons name={item.shareRoomSelect?'check-box':'check-box-outline-blank'} size={25} color={item.shareRoomSelect?Theme.theme:Theme.darkColor} />                   
                </View> 
                <View style={{marginLeft:10}}>
                    <CustomText text={item.Name} style={{fontSize:14}}/>
                    {/* {item.Certificates&&item.Certificates[0]&&<View style={{flexDirection:'row',marginTop:10}}>
                        <CustomText text={item.Certificates[0].TypeDesc+'：'} style={{fontSize:14,color:Theme.darkColor}}/>
                        <CustomText text={item.Certificates[0].SerialNumber} style={{fontSize:14,color:Theme.darkColor}}/>
                    </View>} */}
                    {/* {Array.isArray(item.Certificates) && item.Certificates.length > 0 && (
                        <View style={{ flexDirection: 'row', marginTop: 10 }}>
                            <CustomText text={`${item.Certificates[0].TypeDesc}：`} style={{ fontSize: 14, color: Theme.darkColor }} />
                            <CustomText text={item.Certificates[0].SerialNumber} style={{ fontSize: 14, color: Theme.darkColor }} />
                        </View>
                    )} */}
                    {item.RulesTravelName&&<CustomText text={item.RulesTravelName} style={{fontSize:14,marginTop:5}}/>}
                </View>
            </TouchableOpacity>    
        )
    }
    renderBody() {
        const { projectList } = this.state;
        return (
            <View style={{ flex: 1 }}>
                {
                  !projectList? ViewUtil.PlaceholderList():
                  <FlatList
                    data={projectList}
                    renderItem={this._renderItem}
                    showsVerticalScrollIndicator={false}
                    onMomentumScrollBegin={() => {
                        this.canLoadMore = true;
                    }}
                  />}
            </View>
        )
    }
}
const styles = StyleSheet.create({
    row: {
        backgroundColor: 'white',
        height: 60,
        borderBottomColor: Theme.lineColor,
        borderBottomWidth: 1,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
    },
    btnstyle:{
        borderWidth:0.7,
        borderColor:'gray',
        alignItems:'center',
        marginRight:20,
        height:26,
        borderRadius:13,
    },
    borderStyle:{
        width:30,
        height:30,
    },
    viewStyle:{ 
        backgroundColor: 'white', 
        flexDirection: 'row', 
        padding: 15,
        borderRadius:8 ,
        alignItems:'center',
        borderBottomWidth:0.5,
        borderColor:Theme.lineColor,
        marginHorizontal:5
    },
})