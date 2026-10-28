using ArchUnitNET.Domain;
using ArchUnitNET.Fluent;
using ArchUnitNET.Loader;
using ArchUnitNET.xUnit;
using Microsoft.AspNetCore.Components;
using static ArchUnitNET.Fluent.ArchRuleDefinition;
using static ArchUnitNET.Fluent.Slices.SliceRuleDefinition;

namespace {{根命名空间}}.Tests;

/// <summary>
/// 架构规则：展示组件不注入任何服务、不依赖数据访问；功能之间互不依赖。说明见 .claude/rules/ 里本组件的规范。
/// InjectAttribute 所在的程序集也要加载进来，否则项目里还没有任何注入时，规则会因为找不到这个类型而报错。
/// </summary>
public class ArchitectureTests
{
    private static readonly Architecture _architecture =
        new ArchLoader().LoadAssemblies(typeof({{根命名空间}}.Components.App).Assembly, typeof(InjectAttribute).Assembly).Build();

    private static readonly IObjectProvider<IType> _presentationalComponents =
        Types().That().ResideInNamespaceMatching(@"^{{根命名空间的正则写法}}\.(Features\.[^.]+|Shared)\.Components(\..+)?$").As("展示组件");

    [Fact]
    public void PresentationalComponentsDoNotInjectAnything()
    {
        PropertyMembers().That().AreDeclaredIn(_presentationalComponents)
            .Should().NotHaveAnyAttributes(typeof(InjectAttribute))
            .WithoutRequiringPositiveResults()
            .Check(_architecture);
    }

    [Fact]
    public void PresentationalComponentsDoNotUseDataAccess()
    {
        Types().That().Are(_presentationalComponents)
            .Should().NotDependOnAny(Types().That().ResideInNamespaceMatching(@"^{{根命名空间的正则写法}}\.Features\.[^.]+\.(Services|Data)(\..+)?$"))
            .WithoutRequiringPositiveResults()
            .Check(_architecture);
    }

    [Fact]
    public void FeaturesDoNotDependOnEachOther()
    {
        Slices().Matching("{{根命名空间}}.Features.(*)").Should().NotDependOnEachOther().Check(_architecture);
    }
}
