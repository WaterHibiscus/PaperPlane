using System.Reflection;
using System.Text.Json;
using System.Xml.Linq;
using Microsoft.OpenApi.Models;
using Swashbuckle.AspNetCore.SwaggerGen;

namespace server.OpenApi;

internal sealed class OpenApiXmlCommentsRepository
{
    private readonly Dictionary<string, XElement> _members;

    public OpenApiXmlCommentsRepository()
    {
        var assembly = Assembly.GetExecutingAssembly();
        var xmlFile = $"{assembly.GetName().Name}.xml";
        var xmlPath = Path.Combine(AppContext.BaseDirectory, xmlFile);
        if (!File.Exists(xmlPath))
        {
            _members = new Dictionary<string, XElement>(StringComparer.Ordinal);
            return;
        }

        var document = XDocument.Load(xmlPath);
        _members = document.Descendants("member")
            .Select(member => new
            {
                Name = member.Attribute("name")?.Value,
                Node = member
            })
            .Where(item => !string.IsNullOrWhiteSpace(item.Name))
            .ToDictionary(item => item.Name!, item => item.Node, StringComparer.Ordinal);
    }

    public string? GetTypeSummary(Type type)
    {
        return GetMemberText($"T:{type.FullName}", "summary");
    }

    public string? GetPropertySummary(Type type, string propertyName)
    {
        var propertySummary = GetMemberText($"P:{type.FullName}.{propertyName}", "summary");
        if (!string.IsNullOrWhiteSpace(propertySummary))
        {
            return propertySummary;
        }

        return GetConstructorParamSummary(type, propertyName);
    }

    public string? GetMethodParamSummary(MethodInfo method, string parameterName)
    {
        var member = FindMethodMember(method);
        var param = member?.Elements("param")
            .FirstOrDefault(node => string.Equals(node.Attribute("name")?.Value, parameterName, StringComparison.Ordinal));

        return Normalize(param?.Value);
    }

    private string? GetMemberText(string memberName, string elementName)
    {
        return _members.TryGetValue(memberName, out var member)
            ? Normalize(member.Element(elementName)?.Value)
            : null;
    }

    private string? GetConstructorParamSummary(Type type, string parameterName)
    {
        var constructor = type.GetConstructors(BindingFlags.Public | BindingFlags.Instance)
            .OrderByDescending(item => item.GetParameters().Length)
            .FirstOrDefault();
        if (constructor is null)
        {
            return null;
        }

        var prefix = $"M:{type.FullName}.#ctor(";
        var member = _members
            .Where(item => item.Key.StartsWith(prefix, StringComparison.Ordinal))
            .OrderByDescending(item => item.Value.Elements("param").Count())
            .Select(item => item.Value)
            .FirstOrDefault();

        var param = member?.Elements("param")
            .FirstOrDefault(node => string.Equals(node.Attribute("name")?.Value, parameterName, StringComparison.Ordinal));

        return Normalize(param?.Value);
    }

    private XElement? FindMethodMember(MethodInfo method)
    {
        var prefix = $"M:{method.DeclaringType?.FullName}.{method.Name}";
        return _members
            .Where(item => item.Key.StartsWith(prefix, StringComparison.Ordinal))
            .OrderByDescending(item => item.Value.Elements("param").Count())
            .Select(item => item.Value)
            .FirstOrDefault();
    }

    private static string? Normalize(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return null;
        }

        return string.Join(" ", value
            .Split(new[] { '\r', '\n' }, StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries));
    }
}

internal sealed class XmlCommentsSchemaFilter(OpenApiXmlCommentsRepository repository) : ISchemaFilter
{
    public void Apply(OpenApiSchema schema, SchemaFilterContext context)
    {
        if (string.IsNullOrWhiteSpace(schema.Description))
        {
            schema.Description = repository.GetTypeSummary(context.Type);
        }

        if (schema.Properties.Count == 0)
        {
            return;
        }

        var properties = context.Type
            .GetProperties(BindingFlags.Public | BindingFlags.Instance)
            .ToDictionary(GetSchemaPropertyName, property => property, StringComparer.OrdinalIgnoreCase);

        foreach (var item in schema.Properties)
        {
            if (!properties.TryGetValue(item.Key, out var property))
            {
                continue;
            }

            if (string.IsNullOrWhiteSpace(item.Value.Description))
            {
                item.Value.Description = repository.GetPropertySummary(context.Type, property.Name);
            }
        }
    }

    private static string GetSchemaPropertyName(PropertyInfo property)
    {
        var jsonName = property.GetCustomAttribute<System.Text.Json.Serialization.JsonPropertyNameAttribute>()?.Name;
        return jsonName ?? JsonNamingPolicy.CamelCase.ConvertName(property.Name);
    }
}

internal sealed class XmlCommentsParameterFilter(OpenApiXmlCommentsRepository repository) : IParameterFilter
{
    public void Apply(OpenApiParameter parameter, ParameterFilterContext context)
    {
        if (!string.IsNullOrWhiteSpace(parameter.Description))
        {
            return;
        }

        if (context.PropertyInfo != null)
        {
            parameter.Description = repository.GetPropertySummary(context.PropertyInfo.DeclaringType!, context.PropertyInfo.Name)
                                    ?? OpenApiOperationMetadata.GetGenericParameterDescription(parameter.Name);
            return;
        }

        if (context.ParameterInfo != null)
        {
            var method = context.ParameterInfo.Member as MethodInfo;
            parameter.Description = (method != null
                                        ? repository.GetMethodParamSummary(method, context.ParameterInfo.Name!)
                                        : null)
                                    ?? OpenApiOperationMetadata.GetParameterDescription(method, context.ParameterInfo.Name!)
                                    ?? OpenApiOperationMetadata.GetGenericParameterDescription(parameter.Name);
        }
    }
}

internal sealed class OpenApiMetadataOperationFilter : IOperationFilter
{
    public void Apply(OpenApiOperation operation, OperationFilterContext context)
    {
        var actionKey = OpenApiOperationMetadata.GetActionKey(context.MethodInfo);

        if (OpenApiOperationMetadata.TryGetOperation(actionKey, out var item))
        {
            operation.Summary = item.Summary;
            if (!string.IsNullOrWhiteSpace(item.Description))
            {
                operation.Description = item.Description;
            }
        }

        var tagName = OpenApiOperationMetadata.GetTagName(context.MethodInfo.DeclaringType?.Name);
        if (!string.IsNullOrWhiteSpace(tagName))
        {
            operation.Tags = new List<OpenApiTag> { new() { Name = tagName } };
        }
    }
}
