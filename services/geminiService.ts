
import { GoogleGenAI } from "@google/genai";
import { Transaction, Category, Wallet } from '../types';

export const getFinancialAdvice = async (
  transactions: Transaction[],
  categories: Category[],
  wallets: Wallet[]
): Promise<string> => {
  // Fix: Initialize GoogleGenAI with named parameter apiKey using process.env.API_KEY directly
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // Summarize data for AI context
  const summary = transactions.slice(-20).map(t => {
    const cat = categories.find(c => c.id === t.categoryId);
    return `${t.date}: ${cat?.name} - ${t.amount.toLocaleString('vi-VN')}đ`;
  }).join('\n');

  const totalBalance = wallets.reduce((sum, w) => sum + w.balance, 0);

  const prompt = `
    Dưới đây là danh sách chi tiêu gần đây và tình hình tài chính của tôi:
    - Tổng số dư: ${totalBalance.toLocaleString('vi-VN')}đ
    - Các giao dịch gần nhất:
    ${summary}

    Hãy đóng vai một chuyên gia tư vấn tài chính cá nhân. 
    Dựa trên dữ liệu này, hãy đưa ra 1 lời khuyên ngắn gọn (khoảng 3-4 câu) bằng tiếng Việt để giúp tôi quản lý tiền tốt hơn. 
    Hãy tập trung vào việc tiết kiệm hoặc cảnh báo nếu tôi chi tiêu quá nhiều cho một mục nào đó.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    // Fix: Access the .text property directly (not a method) as per SDK rules
    return response.text || "Hãy tiếp tục theo dõi chi tiêu để có cái nhìn tổng quan hơn về tài chính của bạn.";
  } catch (error) {
    console.error("AI Error:", error);
    return "Không thể kết nối với chuyên gia AI lúc này. Hãy kiểm tra lại sau.";
  }
};
