#!/usr/bin/env bash
# .NET Blazor smoke test: creates a solution following stacks/dotnet-blazor/stack.md, installs the standards, runs the self-check
# commands, then confirms the architecture tests, naming rules and format check catch violations.
source "$(dirname "$0")/lib.sh"
F="$STACKS/dotnet-blazor/files"

step "Create the solution"
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
echo "SDK $(dotnet --version)"

step "Install the standards"
cp "$F/.editorconfig" "$F/Directory.Build.props" .
sed -e 's/{{root namespace regex}}/Demo/g' -e 's/{{root namespace}}/Demo/g' "$F/ArchitectureTests.cs" > tests/Demo.Tests/ArchitectureTests.cs
rm -f tests/Demo.Tests/UnitTest1.cs

step "Layered sample code"
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

step "Self-check commands"
should_pass "format check" dotnet format --verify-no-changes
should_pass "build (warnings as errors)" dotnet build -warnaserror
should_pass "tests (architecture tests included)" dotnet test

step "Violations are caught"
LIST=$FEATURE/Components/OrderList.razor
cp $LIST "$WORK/OrderList.razor.bak"
sed -i '1a @inject Demo.Features.Orders.Services.OrdersService Orders' $LIST
should_fail "presentational component injects a service" dotnet test
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
should_fail "naming and code style violations" dotnet build -warnaserror --no-incremental
rm src/Demo/Shared/Bad.cs

echo
echo ".NET Blazor smoke test passed"
