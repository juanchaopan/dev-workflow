#!/usr/bin/env bash
# .NET Blazor 冒烟测试：按 stacks/dotnet-blazor/stack.md 建解决方案、装规范，跑自检命令，
# 再确认架构测试、命名规则和格式检查会拦下违规。
source "$(dirname "$0")/lib.sh"
F="$STACKS/dotnet-blazor/files"

step "创建解决方案"
cd "$WORK"
dotnet new blazor -o app/src/Demo --interactivity Server
dotnet new xunit -o app/tests/Demo.Tests
cd app
dotnet new sln -n Demo
dotnet sln add src/Demo tests/Demo.Tests
dotnet add tests/Demo.Tests reference src/Demo
dotnet add tests/Demo.Tests package bunit
dotnet add tests/Demo.Tests package TngTech.ArchUnitNET.xUnit
dotnet new gitignore

step "装规范"
cp "$F/.editorconfig" "$F/Directory.Build.props" .
sed -e 's/{{根命名空间的正则写法}}/Demo/g' -e 's/{{根命名空间}}/Demo/g' "$F/ArchitectureTests.cs" > tests/Demo.Tests/ArchitectureTests.cs
rm -f tests/Demo.Tests/UnitTest1.cs

step "按分层写示例代码"
FEATURE=src/Demo/Features/Orders
mkdir -p $FEATURE/Pages $FEATURE/Components $FEATURE/Services src/Demo/Shared/Components
cat > $FEATURE/Services/OrdersService.cs <<'EOF'
namespace Demo.Features.Orders.Services;

public class OrdersService
{
    public IReadOnlyList<string> List() => ["first"];
}
EOF
cat > $FEATURE/Components/OrderList.razor <<'EOF'
@namespace Demo.Features.Orders.Components
<ul>
    @foreach (var order in Items)
    {
        <li @key="order">@order</li>
    }
</ul>
@code {
    [Parameter] public IReadOnlyList<string> Items { get; set; } = [];
}
EOF
cat > tests/Demo.Tests/OrderListTests.cs <<'EOF'
using Bunit;
using Demo.Features.Orders.Components;

namespace Demo.Tests;

public class OrderListTests : BunitContext
{
    [Fact]
    public void RendersEveryOrder()
    {
        var list = Render<OrderList>(parameters => parameters.Add(p => p.Items, ["first", "second"]));

        Assert.Equal(2, list.FindAll("li").Count);
    }
}
EOF
dotnet format

step "自检命令"
should_pass "格式检查" dotnet format --verify-no-changes
should_pass "构建（警告视为错误）" dotnet build -warnaserror
should_pass "测试（含架构测试）" dotnet test

step "违规会被拦下"
LIST=$FEATURE/Components/OrderList.razor
cp $LIST "$WORK/OrderList.razor.bak"
sed -i '1a @inject Demo.Features.Orders.Services.OrdersService Orders' $LIST
should_fail "展示组件注入服务" dotnet test
cp "$WORK/OrderList.razor.bak" $LIST
cat > src/Demo/Shared/Bad.cs <<'EOF'
namespace Demo.Shared;

public interface Service
{
}

public class Bad
{
    private int count;

    public int Get() { if (count > 0) return count; return 0; }
}
EOF
should_fail "命名和代码风格违规" dotnet build -warnaserror --no-incremental
rm src/Demo/Shared/Bad.cs

echo
echo ".NET Blazor 冒烟测试通过"
