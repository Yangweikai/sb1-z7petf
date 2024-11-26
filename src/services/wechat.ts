interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

interface OrderNotification {
  orderId: string;
  items: OrderItem[];
  total: number;
  finalTotal: number;
  couponDiscount: number;
}

interface WeChatConfig {
  appId: string;
  appSecret: string;
  templateId: string;
  toUser: string;
}

const WECHAT_CONFIG: WeChatConfig = {
  appId: import.meta.env.VITE_WECHAT_APP_ID || '',
  appSecret: import.meta.env.VITE_WECHAT_APP_SECRET || '',
  templateId: import.meta.env.VITE_WECHAT_TEMPLATE_ID || '',
  toUser: import.meta.env.VITE_WECHAT_TO_USER || ''
};

export async function sendWeChatNotification(orderData: OrderNotification): Promise<void> {
  try {
    // 1. 获取访问令牌
    const accessToken = await getAccessToken();
    
    // 2. 构建消息模板
    const message = buildTemplateMessage(orderData);
    
    // 3. 发送模板消息
    await sendTemplateMessage(accessToken, message);
  } catch (error) {
    console.error('Failed to send WeChat notification:', error);
    throw new Error('微信通知发送失败');
  }
}

async function getAccessToken(): Promise<string> {
  const url = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${WECHAT_CONFIG.appId}&secret=${WECHAT_CONFIG.appSecret}`;
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.access_token) {
      return data.access_token;
    }
    throw new Error('Failed to get access token');
  } catch (error) {
    console.error('Error getting access token:', error);
    throw new Error('获取微信访问令牌失败');
  }
}

function buildTemplateMessage(orderData: OrderNotification) {
  // 构建详细的订单信息
  const itemsList = orderData.items
    .map(item => `${item.name} x${item.quantity} ¥${item.price * item.quantity}`)
    .join('\n');

  return {
    touser: WECHAT_CONFIG.toUser,
    template_id: WECHAT_CONFIG.templateId,
    url: `https://your-domain.com/orders/${orderData.orderId}`,
    data: {
      first: {
        value: '新订单通知',
        color: '#173177'
      },
      keyword1: {
        value: orderData.orderId,
        color: '#173177'
      },
      keyword2: {
        value: itemsList,
        color: '#173177'
      },
      keyword3: {
        value: `¥${orderData.total.toFixed(2)}`,
        color: '#173177'
      },
      keyword4: {
        value: orderData.couponDiscount > 0 
          ? `使用优惠券减免 ¥${orderData.couponDiscount.toFixed(2)}`
          : '未使用优惠券',
        color: '#173177'
      },
      keyword5: {
        value: `¥${orderData.finalTotal.toFixed(2)}`,
        color: '#FF0000'
      },
      remark: {
        value: '感谢您的订购！',
        color: '#173177'
      }
    }
  };
}

async function sendTemplateMessage(accessToken: string, message: any): Promise<void> {
  const url = `https://api.weixin.qq.com/cgi-bin/message/template/send?access_token=${accessToken}`;
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(message)
    });
    
    const data = await response.json();
    
    if (data.errcode !== 0) {
      throw new Error(`发送模板消息失败: ${data.errmsg}`);
    }
  } catch (error) {
    console.error('Error sending template message:', error);
    throw new Error('发送微信模板消息失败');
  }
}