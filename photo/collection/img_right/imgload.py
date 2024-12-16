import os

def generate_image_markdown(folder_path, output_file):
    # 支持的图片格式
    image_extensions = ['.jpg', '.jpeg', '.png', '.gif']
    
    # 打开输出文件
    with open(output_file, 'w', encoding='utf-8') as outfile:
        # 遍历文件夹中的所有文件
        for filename in os.listdir(folder_path):
            # 检查文件是否是图片
            if any(filename.lower().endswith(ext) for ext in image_extensions):
                # 写入html格式的图片引用
                outfile.write(f'<img src="https://fastly.jsdelivr.net/gh/sanqi-normal/sanqi-normal.github.io/photo/collection/img_right/{filename}">\n')

def replace_content_in_post(img_md_file, post_md_file, start_marker, end_marker):
    # 读取img.md的内容
    with open(img_md_file, 'r', encoding='utf-8') as img_file:
        img_content = img_file.read()
    
    # 读取post.md的内容
    with open(post_md_file, 'r', encoding='utf-8') as post_file:
        post_content = post_file.read()
    
    # 查找起始和结束位置
    start_index = post_content.find(start_marker)
    end_index = post_content.find(end_marker, start_index + len(start_marker))
    
    if start_index == -1 or end_index == -1:
        raise ValueError("起始或结束标记未找到")
    
    # 替换内容
    updated_post_content = post_content[:start_index] + start_marker + '\n' + img_content + '\n' + end_marker + '\n' + post_content[end_index + len(end_marker):]
    
    # 将更新后的内容写回post.md
    with open(post_md_file, 'w', encoding='utf-8') as post_file:
        post_file.write(updated_post_content)

# 使用示例
folder_path = 'c:\\Users\\28171\\hexo-blog\\source\\photo\\collection\\img_right'
output_file = 'c:\\Users\\28171\\hexo-blog\\source\\photo\\collection\\imgright.md'
post_md_file = 'c:\\Users\\28171\\hexo-blog\\source\\photo\\collection\\index.md'

# 生成img.md文件
generate_image_markdown(folder_path, output_file)

# 定义起始和结束标记
start_marker = "<!-- 右半部分开始图片替换 -->"
end_marker = "<!-- 右半部分结束图片替换 -->"

# 将img.md的内容替换index.md中指定标记之间的内容
replace_content_in_post(output_file, post_md_file, start_marker, end_marker)
