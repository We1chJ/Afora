console.log('🚀 开始数据库迁移...');

// 这个脚本需要在Next.js应用的上下文中运行
// 请复制以下代码到浏览器控制台中运行

const runMigration = async () => {
  try {
    // 注意：这些函数需要在Next.js应用环境中才能访问
    console.log('📋 步骤1：迁移任务数据...');
    
    // 您需要在浏览器控制台中手动调用这些函数
    console.log('请在浏览器控制台中运行以下代码：');
    console.log(`
    // 1. 导入函数
    import { migrateTasksToTaskPool, initializeUserScores } from '/actions/actions';
    
    // 2. 运行任务迁移
    const taskResult = await migrateTasksToTaskPool();
    console.log('任务迁移结果:', taskResult);
    
    // 3. 初始化用户积分
    const scoreResult = await initializeUserScores();
    console.log('积分初始化结果:', scoreResult);
    `);
    
  } catch (error) {
    console.error('迁移失败:', error);
  }
};

console.log('准备就绪！请在您的Afora应用页面的浏览器控制台中运行上述代码。');
