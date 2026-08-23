with open("src/components/views/MissionTabView.tsx", "r") as f:
    content = f.read()

content = content.replace(
    '''                           setNewsContent(prev => prev ? prev + "

" + data.content : data.content);''',
    '''                           setNewsContent(prev => prev ? prev + "\\n\\n" + data.content : data.content);'''
)

with open("src/components/views/MissionTabView.tsx", "w") as f:
    f.write(content)
