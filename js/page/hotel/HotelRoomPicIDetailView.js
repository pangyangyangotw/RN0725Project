import React from 'react';
import {
    View,
    StyleSheet,
    Dimensions,
    
} from 'react-native';
import CustomText from '../../custom/CustomText';

import ImageViewer from 'react-native-image-zoom-viewer';
import SuperView from '../../super/SuperView';
const screenWidth = Dimensions.get('screen').width;
export default class HotelRoomPicIDetailView extends SuperView {

    constructor(props) {
        super(props); 
        this.params = (props.route && props.route.params) || (props.navigation && props.navigation.state && props.navigation.state.params) || {};      
        this.state = {
        };

    }
   
    render() {
        const {state} = this.props.navigation;
        if(!this.params) return null; 
        let images =
            this.params.items.map(item => ({
                url:item,
                props:{},
            }))
        return (
            <View style={{ flex: 1 }}>
                <ImageViewer
                    style={{width:screenWidth,height:100}}
                    imageUrls={images} // 照片路径
                    enableImageZoom={true} // 是否开启手势缩放
                    index={this.params.index} // 初始显示第几张
                    // failImageSource={aaa} // 加载失败图片
                    onChange={(index) => {}} // 图片切换时触发
                    onClick={() => { // 图片单击事件
                        this.pop();
                    }}
                />
            </View>
        )
    } 
}
const styles = StyleSheet.create({
    titleStyle:{
        
    },
  
})