import React from 'react';
import {
    View,
    FlatList,
    StyleSheet,
    TouchableHighlight,
    TouchableOpacity
} from 'react-native';
import SuperView from '../../super/SuperView';
import CustomText from '../../custom/CustomText';
import Theme from '../../res/styles/Theme';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import ViewUtil from '../../util/ViewUtil'

export default class HotelChoosePersonScreen extends SuperView {
    constructor(props) {
        super(props);
        this.params = (props.route && props.route.params) || (props.navigation && props.navigation.state && props.navigation.state.params) || {};
        this._navigationHeaderView = {
            title:this.params.title,
            rightButton: ViewUtil.getRightButton('保存',this._rightClick)
        }
        this._tabBarBottomView = {
            bottomInset: true
        }
        this.state = {
            projectList: [],
            projectAfterList: [],
            selectLists:[],
            selectArr:[]
        }
    }
    componentDidMount(){
        const { selectList } = this.params;
        const { selectLists } = this.props;
        selectList&&selectList.map((item)=>{
           item.select = false
        })
        this.setState({
            selectLists: selectList
        })    
    }
    
    _rightClick =() =>{
        // projectList
        const {selectLists,selectArr} = this.state;
        const { callBack } = this.params;
        selectLists.map((item)=>{
            if(item.select){
                selectArr.push(item);
            }
        })
        this.setState({});
        callBack(selectArr);
        this.pop();
    }
    _select=(item)=>{
            item.select = !item.select
            this.setState({})   
    }
   
    _renderItem = ({ item, index }) => {
        return (
            <TouchableOpacity style={styles.viewStyle}
                              onPress = {()=>{this._select(item)}}
            >
                <View style={styles.borderStyle}>
                   <MaterialIcons name={item.select?'check-box':'check-box-outline-blank'} size={25} color={item.select?Theme.theme:Theme.darkColor} />                  
                </View> 
                <View style={{marginLeft:10}}>
                    <CustomText text={item.Name} style={{fontSize:14}}/>
                    {/* {item.Certificates&&item.Certificates[0]&&<View style={{flexDirection:'row',marginTop:10}}>
                        <CustomText text={item.Certificates[0].TypeDesc+'：'} style={{fontSize:14,color:Theme.darkColor}}/>
                        <CustomText text={item.Certificates[0].SerialNumber} style={{fontSize:14,color:Theme.darkColor}}/>
                    </View>} */}
                    {Array.isArray(item.Certificates) && item.Certificates.length > 0 && (
                        <View style={{ flexDirection: 'row', marginTop: 10 }}>
                            <CustomText text={`${item.Certificates[0].TypeDesc}：`} style={{ fontSize: 14, color: Theme.darkColor }} />
                            <CustomText text={item.Certificates[0].SerialNumber} style={{ fontSize: 14, color: Theme.darkColor }} />
                        </View>
                    )}
                    {item.RulesTravelName&&<CustomText text={item.RulesTravelName} style={{fontSize:14,marginTop:5}}/>}
                </View>
            </TouchableOpacity>    
        )
    }
    renderBody() {
        const { projectList,selectLists } = this.state;
        return (
            <View style={{ flex: 1 }}>
                <FlatList
                    data={selectLists}
                    renderItem={this._renderItem}
                    showsVerticalScrollIndicator={false}
                    onMomentumScrollBegin={() => {
                        this.canLoadMore = true;
                    }}
                />
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