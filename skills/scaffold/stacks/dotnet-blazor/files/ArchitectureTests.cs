using ArchUnitNET.Domain;
using ArchUnitNET.Fluent;
using ArchUnitNET.Loader;
using ArchUnitNET.xUnit;
using Microsoft.AspNetCore.Components;
using static ArchUnitNET.Fluent.ArchRuleDefinition;
using static ArchUnitNET.Fluent.Slices.SliceRuleDefinition;

namespace {{root namespace}}.Tests;

/// <summary>
/// Architecture rules: presentational components inject no services and do not depend on data access; features do not depend
/// on each other. Explained in this component's standards in .claude/rules/.
/// The assembly of InjectAttribute is loaded too; otherwise the rule fails to find the type while the project has no injection yet.
/// </summary>
public class ArchitectureTests
{
    private static readonly Architecture _architecture =
        new ArchLoader().LoadAssemblies(typeof({{root namespace}}.Components.App).Assembly, typeof(InjectAttribute).Assembly).Build();

    private static readonly IObjectProvider<IType> _presentationalComponents =
        Types().That().ResideInNamespaceMatching(@"^{{root namespace regex}}\.(Features\.[^.]+|Shared)\.Components(\..+)?$").As("presentational components");

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
            .Should().NotDependOnAny(Types().That().ResideInNamespaceMatching(@"^{{root namespace regex}}\.Features\.[^.]+\.(Services|Data)(\..+)?$"))
            .WithoutRequiringPositiveResults()
            .Check(_architecture);
    }

    [Fact]
    public void FeaturesDoNotDependOnEachOther()
    {
        Slices().Matching("{{root namespace}}.Features.(*)").Should().NotDependOnEachOther().Check(_architecture);
    }
}
